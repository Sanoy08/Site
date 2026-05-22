package com.bumbaskitchen.app;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.auth.api.phone.SmsRetriever;
import com.google.android.gms.auth.api.phone.SmsRetrieverClient;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "AndroidAuth")
public class AndroidAuthPlugin extends Plugin {

    private PluginCall phoneCall;
    private PluginCall smsCall;

    @PluginMethod
    public void requestPhoneNumber(PluginCall call) {
        this.phoneCall = call;
        GetPhoneNumberHintIntentRequest request = GetPhoneNumberHintIntentRequest.builder().build();

        Identity.getSignInClient(getActivity())
                .getPhoneNumberHintIntent(request)
                .addOnSuccessListener(result -> {
                    try {
                        getActivity().startIntentSenderForResult(
                                result.getIntentSender(),
                                1001,
                                null,
                                0,
                                0,
                                0
                        );
                    } catch (Exception e) {
                        call.reject("Cannot start hint intent", e);
                    }
                })
                .addOnFailureListener(e -> {
                    call.reject("Phone hint failed", e);
                });
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode == 1001 && phoneCall != null) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                try {
                    String phoneNumber = Identity.getSignInClient(getActivity()).getPhoneNumberFromIntent(data);
                    JSObject ret = new JSObject();
                    ret.put("phoneNumber", phoneNumber);
                    phoneCall.resolve(ret);
                } catch (Exception e) {
                    phoneCall.reject("Failed to parse number");
                }
            } else {
                phoneCall.reject("User cancelled or failed");
            }
            phoneCall = null;
        }
    }

    @PluginMethod
    public void startSmsRetriever(PluginCall call) {
        this.smsCall = call;
        SmsRetrieverClient client = SmsRetriever.getClient(getContext());
        Task<Void> task = client.startSmsRetriever();

        task.addOnSuccessListener(aVoid -> {
            IntentFilter intentFilter = new IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION);
            // ★ FIX: Android 13+ এর জন্য RECEIVER_NOT_EXPORTED flag যোগ করা হয়েছে ★
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                getContext().registerReceiver(smsReceiver, intentFilter, SmsRetriever.SEND_PERMISSION, null, Context.RECEIVER_NOT_EXPORTED);
            } else {
                getContext().registerReceiver(smsReceiver, intentFilter, SmsRetriever.SEND_PERMISSION, null);
            }
        });

        task.addOnFailureListener(e -> {
            call.reject("Failed to start SMS retriever", e);
        });
    }

    private final BroadcastReceiver smsReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (SmsRetriever.SMS_RETRIEVED_ACTION.equals(intent.getAction())) {
                Bundle extras = intent.getExtras();
                if (extras != null) {
                    Status smsRetrieverStatus = (Status) extras.get(SmsRetriever.EXTRA_STATUS);

                    if (smsRetrieverStatus != null) {
                        switch (smsRetrieverStatus.getStatusCode()) {
                            case CommonStatusCodes.SUCCESS:
                                String message = (String) extras.get(SmsRetriever.EXTRA_SMS_MESSAGE);
                                if (smsCall != null) {
                                    JSObject ret = new JSObject();
                                    ret.put("message", message);
                                    smsCall.resolve(ret);
                                    smsCall = null;
                                }
                                break;
                            case CommonStatusCodes.TIMEOUT:
                                if (smsCall != null) {
                                    smsCall.reject("SMS Retrieval Timeout");
                                    smsCall = null;
                                }
                                break;
                        }
                    }
                }
                try {
                    getContext().unregisterReceiver(this);
                } catch (Exception ignored) {}
            }
        }
    };
}