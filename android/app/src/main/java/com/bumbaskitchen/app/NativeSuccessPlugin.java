package com.bumbaskitchen.app;

import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.media.MediaPlayer;

import com.airbnb.lottie.LottieAnimationView;
import com.airbnb.lottie.LottieDrawable;
import android.animation.Animator; // ★ অ্যানিমেশন লিসেনারের জন্য

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeSuccess")
public class NativeSuccessPlugin extends Plugin {
    private RelativeLayout overlayLayout;
    private MediaPlayer mediaPlayer;

    @PluginMethod
    public void show(PluginCall call) {
        String orderId = call.getString("orderId", "...");
        String name = call.getString("name", "Guest");
        String amount = call.getString("amount", "0");
        int coins = call.getInt("coins", 0);

        getActivity().runOnUiThread(() -> {
            // সাউন্ড প্লে করা
            try {
                mediaPlayer = MediaPlayer.create(getContext(), R.raw.success_sound);
                if (mediaPlayer != null) mediaPlayer.start();
            } catch (Exception e) {}

            // =====================================
            // ★ NATIVE UI BUILDER
            // =====================================
            overlayLayout = new RelativeLayout(getContext());
            overlayLayout.setBackgroundColor(Color.WHITE);
            overlayLayout.setElevation(200f);
            overlayLayout.setAlpha(0f); // ফেড-ইন অ্যানিমেশনের জন্য

            LinearLayout centerBox = new LinearLayout(getContext());
            centerBox.setOrientation(LinearLayout.VERTICAL);
            centerBox.setGravity(Gravity.CENTER_HORIZONTAL);
            centerBox.setPadding(60, 0, 60, 0);
            RelativeLayout.LayoutParams boxParams = new RelativeLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            boxParams.addRule(RelativeLayout.CENTER_IN_PARENT);
            overlayLayout.addView(centerBox, boxParams);

            // ১. Lottie Tick Animation (With Custom Loop Logic)
            LottieAnimationView successLottie = new LottieAnimationView(getContext());
            successLottie.setAnimation(R.raw.success_anim);
            successLottie.setRepeatCount(0); // প্রথমে শুধু একবার জিরো থেকে প্লে হবে
            successLottie.playAnimation();
            
            // ★ লুপ লজিক: প্রথমবার শেষ হলে ৮৮ ফ্রেম থেকে ইনফিনিট লুপ শুরু হবে
            successLottie.addAnimatorListener(new Animator.AnimatorListener() {
                @Override public void onAnimationStart(Animator animation) {}
                @Override public void onAnimationCancel(Animator animation) {}
                @Override public void onAnimationRepeat(Animator animation) {}
                
                @Override
                public void onAnimationEnd(Animator animation) {
                    successLottie.removeAllAnimatorListeners(); // লিসেনার রিমুভ যাতে বারবার ট্রিগার না হয়
                    successLottie.setMinFrame(88); // ৮৮ ফ্রেম থেকে শুরু হবে
                    successLottie.setRepeatCount(LottieDrawable.INFINITE); // ইনফিনিট লুপ
                    successLottie.playAnimation();
                }
            });

            int lSize = (int) (140 * getContext().getResources().getDisplayMetrics().density);
            centerBox.addView(successLottie, new LinearLayout.LayoutParams(lSize, lSize));

            // ২. Title Text
            TextView title = new TextView(getContext());
            title.setText("Order Placed!");
            title.setTextSize(28f);
            title.setTextColor(Color.parseColor("#111827"));
            title.setTypeface(null, Typeface.BOLD);
            centerBox.addView(title);

            TextView subtitle = new TextView(getContext());
            subtitle.setText("Awesome, " + name + "! Your food is getting ready.");
            subtitle.setTextSize(15f);
            subtitle.setTextColor(Color.parseColor("#6B7280"));
            subtitle.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams subParams = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            subParams.setMargins(0, 10, 0, 60);
            centerBox.addView(subtitle, subParams);

            // ৩. Order Details Card (Gray)
            LinearLayout detailsCard = new LinearLayout(getContext());
            detailsCard.setOrientation(LinearLayout.VERTICAL);
            GradientDrawable detailsBg = new GradientDrawable();
            detailsBg.setColor(Color.parseColor("#F9FAFB"));
            detailsBg.setCornerRadius(30f);
            detailsBg.setStroke(2, Color.parseColor("#E5E7EB"));
            detailsCard.setBackground(detailsBg);
            detailsCard.setPadding(40, 40, 40, 40);

            TextView idText = new TextView(getContext());
            idText.setText("ORDER ID: #" + orderId);
            idText.setTextColor(Color.parseColor("#6B7280"));
            idText.setTypeface(null, Typeface.BOLD);
            idText.setTextSize(12f);
            detailsCard.addView(idText);

            TextView amtText = new TextView(getContext());
            amtText.setText("AMOUNT PAID: " + amount);
            amtText.setTextColor(Color.parseColor("#6a9c27"));
            amtText.setTypeface(null, Typeface.BOLD);
            amtText.setTextSize(18f);
            amtText.setPadding(0, 10, 0, 0);
            detailsCard.addView(amtText);

            centerBox.addView(detailsCard, new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

            // ৪. Coins Earned Card (Yellow)
            LinearLayout coinsCard = new LinearLayout(getContext());
            GradientDrawable coinsBg = new GradientDrawable();
            coinsBg.setColor(Color.parseColor("#FFFBEB"));
            coinsBg.setCornerRadius(30f);
            coinsBg.setStroke(2, Color.parseColor("#FEF3C7"));
            coinsCard.setBackground(coinsBg);
            coinsCard.setPadding(40, 30, 40, 30);
            LinearLayout.LayoutParams cParams = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            cParams.setMargins(0, 20, 0, 20);
            
            TextView coinsTitle = new TextView(getContext());
            coinsTitle.setText("Coins on the way!");
            coinsTitle.setTextColor(Color.parseColor("#92400E"));
            coinsTitle.setTypeface(null, Typeface.BOLD);
            coinsCard.addView(coinsTitle, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));

            TextView coinsAmt = new TextView(getContext());
            coinsAmt.setText("+" + coins);
            coinsAmt.setTextColor(Color.parseColor("#D97706"));
            coinsAmt.setTextSize(18f);
            coinsAmt.setTypeface(null, Typeface.BOLD);
            coinsCard.addView(coinsAmt);
            centerBox.addView(coinsCard, cParams);

            // ৫. Buttons
            Button viewBtn = new Button(getContext());
            GradientDrawable btnBg = new GradientDrawable();
            btnBg.setColor(Color.parseColor("#6a9c27"));
            btnBg.setCornerRadius(30f);
            viewBtn.setBackground(btnBg);
            viewBtn.setText("View Order");
            viewBtn.setTextColor(Color.WHITE);
            viewBtn.setAllCaps(false);
            viewBtn.setElevation(10f);
            LinearLayout.LayoutParams vParams = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, (int)(55 * getContext().getResources().getDisplayMetrics().density));
            vParams.setMargins(0, 30, 0, 15);
            centerBox.addView(viewBtn, vParams);

            Button homeBtn = new Button(getContext());
            homeBtn.setBackgroundColor(Color.TRANSPARENT);
            homeBtn.setText("Back to Home");
            homeBtn.setTextColor(Color.parseColor("#6B7280"));
            homeBtn.setAllCaps(false);
            centerBox.addView(homeBtn, new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

            // =====================================
            // ★ BUTTON ACTIONS (Route Webview)
            // =====================================
            viewBtn.setOnClickListener(v -> {
                getBridge().getWebView().evaluateJavascript("window.location.href='/account/orders';", null);
                hideOverlay();
            });

            homeBtn.setOnClickListener(v -> {
                getBridge().getWebView().evaluateJavascript("window.location.href='/menus';", null);
                hideOverlay();
            });

            // 화면ે যোগ করা এবং অ্যানিমেশন
            getActivity().addContentView(overlayLayout, new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            overlayLayout.animate().alpha(1f).setDuration(400).start();
        });

        call.resolve();
    }

    private void hideOverlay() {
        if (overlayLayout != null && overlayLayout.getParent() != null) {
            overlayLayout.animate().alpha(0f).translationY(50f).setDuration(300).withEndAction(() -> {
                ((ViewGroup) overlayLayout.getParent()).removeView(overlayLayout);
                overlayLayout = null;
                if (mediaPlayer != null) {
                    mediaPlayer.release();
                    mediaPlayer = null;
                }
            }).start();
        }
    }
}