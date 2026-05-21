package com.bumbaskitchen.app;

import android.app.PendingIntent;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Bundle;
import android.util.Base64;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Google Auth & SMS Retriever APIs
import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.auth.api.phone.SmsRetriever;
import com.google.android.gms.auth.api.phone.SmsRetrieverClient;
import com.google.android.gms.tasks.Task;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CapacitorPlugin(name = "NativeAuth")
public class NativeAuthPlugin extends Plugin {

    private PluginCall smsCall = null;
    private PluginCall phoneCall = null;
    private BroadcastReceiver smsVerificationReceiver;

    // ১. Phone Number Suggestion Logic (Updated & Fixed)
    @PluginMethod
    public void requestPhoneHint(PluginCall call) {
        this.phoneCall = call;
        GetPhoneNumberHintIntentRequest request = GetPhoneNumberHintIntentRequest.builder().build();

        Identity.getSignInClient(getActivity())
            .getPhoneNumberHintIntent(request)
            .addOnSuccessListener(pendingIntent -> {
                try {
                    // ★ Fix: Properly launch the PendingIntent
                    getActivity().startIntentSenderForResult(
                        pendingIntent.getIntentSender(),
                        9001, null, 0, 0, 0
                    );
                } catch (Exception e) {
                    call.reject("Intent failed");
                }
            })
            .addOnFailureListener(e -> {
                call.reject("Phone hint failed");
            });
    }

    // ★ Fix: Handle the result from startIntentSenderForResult
    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode == 9001) {
            if (resultCode == getActivity().RESULT_OK && data != null) {
                try {
                    String phoneNumber = Identity.getSignInClient(getActivity()).getPhoneNumberFromIntent(data);
                    com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
                    ret.put("phone", phoneNumber);
                    if (phoneCall != null) phoneCall.resolve(ret);
                } catch (Exception e) {
                    if (phoneCall != null) phoneCall.reject("Failed to parse phone number");
                }
            } else {
                if (phoneCall != null) phoneCall.reject("User cancelled");
            }
        }
    }

    // ২. SMS Retriever Logic
    @PluginMethod
    public void startSmsRetriever(PluginCall call) {
        this.smsCall = call;

        SmsRetrieverClient client = SmsRetriever.getClient(getContext());
        Task<Void> task = client.startSmsRetriever();

        task.addOnSuccessListener(aVoid -> {
            if (smsVerificationReceiver == null) {
                smsVerificationReceiver = new BroadcastReceiver() {
                    @Override
                    public void onReceive(Context context, Intent intent) {
                        if (SmsRetriever.SMS_RETRIEVED_ACTION.equals(intent.getAction())) {
                            Bundle extras = intent.getExtras();
                            if (extras != null) {
                                String smsMessage = (String) extras.get(SmsRetriever.EXTRA_SMS_MESSAGE);
                                if (smsMessage != null && smsCall != null) {
                                    // Extract exactly 6 digits
                                    Pattern pattern = Pattern.compile("(\\d{6})");
                                    Matcher matcher = pattern.matcher(smsMessage);
                                    if (matcher.find()) {
                                        String otp = matcher.group(1);
                                        com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
                                        ret.put("otp", otp);
                                        smsCall.resolve(ret);
                                    }
                                }
                            }
                            try { getContext().unregisterReceiver(this); } catch (Exception e) {}
                            smsVerificationReceiver = null;
                        }
                    }
                };
                IntentFilter intentFilter = new IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION);
                getContext().registerReceiver(smsVerificationReceiver, intentFilter, SmsRetriever.SEND_PERMISSION, null);
            }
        });

        task.addOnFailureListener(e -> {
            call.reject("Failed to start SMS retriever");
        });
    }

    // ৩. ★ MAGIC: Get App Hash directly without Android Studio!
    @PluginMethod
    public void getAppHash(PluginCall call) {
        try {
            String pkgName = getContext().getPackageName();
            PackageManager pm = getContext().getPackageManager();
            Signature[] signatures = pm.getPackageInfo(pkgName, PackageManager.GET_SIGNATURES).signatures;
            
            String appInfo = pkgName + " " + signatures[0].toCharsString();
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            messageDigest.update(appInfo.getBytes(StandardCharsets.UTF_8));
            byte[] hashSignature = messageDigest.digest();

            hashSignature = Arrays.copyOfRange(hashSignature, 0, 9);
            String base64Hash = Base64.encodeToString(hashSignature, Base64.NO_PADDING | Base64.NO_WRAP);
            base64Hash = base64Hash.substring(0, 11); // Take exactly 11 characters

            com.getcapacitor.JSObject ret = new com.getcapacitor.JSObject();
            ret.put("hash", base64Hash);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Hash generation failed: " + e.getMessage());
        }
    }
}