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
import android.view.View;
import android.animation.ValueAnimator; // ★ সাইজ ছোট-বড় করার অ্যানিমেশনের জন্য
import android.os.Handler;
import android.os.Looper;
import android.view.animation.DecelerateInterpolator;

import com.airbnb.lottie.LottieAnimationView;
import com.airbnb.lottie.LottieDrawable;
import android.animation.Animator;

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
            float density = getContext().getResources().getDisplayMetrics().density;

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

            // Wrapper Box
            LinearLayout wrapperBox = new LinearLayout(getContext());
            wrapperBox.setOrientation(LinearLayout.VERTICAL);
            wrapperBox.setGravity(Gravity.CENTER_HORIZONTAL);
            wrapperBox.setPadding((int)(30*density), 0, (int)(30*density), 0);
            
            RelativeLayout.LayoutParams boxParams = new RelativeLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            boxParams.addRule(RelativeLayout.CENTER_IN_PARENT);
            overlayLayout.addView(wrapperBox, boxParams);

            // =====================================
            // STAGE 0: Lottie Animation (প্রথমে বিশাল বড় থাকবে)
            // =====================================
            LottieAnimationView successLottie = new LottieAnimationView(getContext());
            successLottie.setAnimation(R.raw.success_anim);
            successLottie.setRepeatCount(0); 
            successLottie.playAnimation();
            
            // ৮৮ ফ্রেম থেকে লুপ হওয়ার লজিক
            successLottie.addAnimatorListener(new Animator.AnimatorListener() {
                @Override public void onAnimationStart(Animator animation) {}
                @Override public void onAnimationCancel(Animator animation) {}
                @Override public void onAnimationRepeat(Animator animation) {}
                @Override
                public void onAnimationEnd(Animator animation) {
                    successLottie.removeAllAnimatorListeners(); 
                    successLottie.setMinFrame(88); 
                    successLottie.setRepeatCount(LottieDrawable.INFINITE); 
                    successLottie.playAnimation();
                }
            });

            // ★ যখন একা থাকবে, তখনকার বিশাল সাইজ (240dp)
            int initialSize = (int) (240 * density); 
            // ★ যখন ডিটেইলস আসবে, তখনকার সাইজ (135dp - আগের 110dp এর থেকে বড়)
            int finalSize = (int) (135 * density);   

            LinearLayout.LayoutParams lottieParams = new LinearLayout.LayoutParams(initialSize, initialSize);
            lottieParams.bottomMargin = 0; // প্রথমে মার্জিন জিরো
            wrapperBox.addView(successLottie, lottieParams);

            // =====================================
            // STAGE 1: Content Box (প্রথমে হাইড করা থাকবে)
            // =====================================
            LinearLayout contentBox = new LinearLayout(getContext());
            contentBox.setOrientation(LinearLayout.VERTICAL);
            contentBox.setGravity(Gravity.CENTER_HORIZONTAL);
            contentBox.setVisibility(View.GONE); 

            // Title
            TextView title = new TextView(getContext());
            title.setText("Order Placed!");
            title.setTextSize(26f);
            title.setTextColor(Color.parseColor("#111827"));
            title.setTypeface(null, Typeface.BOLD);
            contentBox.addView(title);

            // Subtitle
            TextView subtitle = new TextView(getContext());
            subtitle.setText("Awesome, " + name + "! Your food is getting ready.");
            subtitle.setTextSize(14f);
            subtitle.setTextColor(Color.parseColor("#6B7280"));
            subtitle.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams subParams = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            subParams.setMargins(0, (int)(8*density), 0, (int)(25*density));
            contentBox.addView(subtitle, subParams);

            // Order Details Card
            LinearLayout detailsCard = new LinearLayout(getContext());
            detailsCard.setOrientation(LinearLayout.VERTICAL);
            GradientDrawable detailsBg = new GradientDrawable();
            detailsBg.setColor(Color.parseColor("#F9FAFB"));
            detailsBg.setCornerRadius(40f);
            detailsBg.setStroke(3, Color.parseColor("#F3F4F6"));
            detailsCard.setBackground(detailsBg);
            detailsCard.setPadding((int)(20*density), (int)(15*density), (int)(20*density), (int)(15*density));

            TextView idText = new TextView(getContext());
            idText.setText("ORDER ID: #" + orderId);
            idText.setTextColor(Color.parseColor("#9CA3AF"));
            idText.setTypeface(null, Typeface.BOLD);
            idText.setTextSize(11f);
            detailsCard.addView(idText);

            TextView amtText = new TextView(getContext());
            amtText.setText("Amount: " + amount);
            amtText.setTextColor(Color.parseColor("#6a9c27"));
            amtText.setTypeface(null, Typeface.BOLD);
            amtText.setTextSize(16f);
            amtText.setPadding(0, (int)(5*density), 0, 0);
            detailsCard.addView(amtText);

            contentBox.addView(detailsCard, new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

            // Coins Earned Card
            LinearLayout coinsCard = new LinearLayout(getContext());
            GradientDrawable coinsBg = new GradientDrawable();
            coinsBg.setColor(Color.parseColor("#FFFBEB"));
            coinsBg.setCornerRadius(40f);
            coinsBg.setStroke(3, Color.parseColor("#FEF3C7"));
            coinsCard.setBackground(coinsBg);
            coinsCard.setPadding((int)(20*density), (int)(15*density), (int)(20*density), (int)(15*density));
            LinearLayout.LayoutParams cParams = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            cParams.setMargins(0, (int)(15*density), 0, (int)(25*density));
            
            TextView coinsTitle = new TextView(getContext());
            coinsTitle.setText("Coins on the way!");
            coinsTitle.setTextColor(Color.parseColor("#92400E"));
            coinsTitle.setTypeface(null, Typeface.BOLD);
            coinsCard.addView(coinsTitle, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));

            TextView coinsAmt = new TextView(getContext());
            coinsAmt.setText("+" + coins);
            coinsAmt.setTextColor(Color.parseColor("#D97706"));
            coinsAmt.setTextSize(16f);
            coinsAmt.setTypeface(null, Typeface.BOLD);
            coinsCard.addView(coinsAmt);
            contentBox.addView(coinsCard, cParams);

            // Buttons
            Button viewBtn = new Button(getContext());
            GradientDrawable btnBg = new GradientDrawable();
            btnBg.setColor(Color.parseColor("#6a9c27"));
            btnBg.setCornerRadius(40f);
            viewBtn.setBackground(btnBg);
            viewBtn.setText("View Order");
            viewBtn.setTextColor(Color.WHITE);
            viewBtn.setAllCaps(false);
            viewBtn.setElevation(8f);
            LinearLayout.LayoutParams vParams = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, (int)(55 * density));
            vParams.setMargins(0, 0, 0, (int)(10*density));
            contentBox.addView(viewBtn, vParams);

            Button homeBtn = new Button(getContext());
            homeBtn.setBackgroundColor(Color.TRANSPARENT);
            homeBtn.setText("Back to Home");
            homeBtn.setTextColor(Color.parseColor("#6B7280"));
            homeBtn.setAllCaps(false);
            contentBox.addView(homeBtn, new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

            wrapperBox.addView(contentBox);

            // =====================================
            // ★ MAGIC SHRINK & REVEAL ANIMATION 
            // =====================================
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                
                // ১. Lottie কে স্মুথলি ছোট করে ওপরে পাঠানো
                ValueAnimator sizeAnimator = ValueAnimator.ofFloat(0f, 1f);
                sizeAnimator.addUpdateListener(animation -> {
                    float fraction = animation.getAnimatedFraction();
                    // 240dp থেকে 135dp তে আসবে
                    int currentSize = (int) (initialSize - ((initialSize - finalSize) * fraction));
                    lottieParams.width = currentSize;
                    lottieParams.height = currentSize;
                    // মার্জিন 0 থেকে 15dp তে বাড়বে
                    lottieParams.bottomMargin = (int) (15 * density * fraction); 
                    successLottie.requestLayout();
                });
                sizeAnimator.setDuration(600);
                sizeAnimator.setInterpolator(new DecelerateInterpolator());
                sizeAnimator.start();

                // ২. Content Box কে নিচ থেকে তুলে আনা
                contentBox.setVisibility(View.VISIBLE);
                contentBox.setAlpha(0f);
                contentBox.setTranslationY(100f); 

                contentBox.animate()
                        .alpha(1f)
                        .translationY(0f)
                        .setDuration(600)
                        .setInterpolator(new DecelerateInterpolator())
                        .start();

            }, 1500); 

            // =====================================
            // BUTTON ACTIONS
            // =====================================
            viewBtn.setOnClickListener(v -> {
                getBridge().getWebView().evaluateJavascript("window.location.href='/account/orders';", null);
                hideOverlay();
            });

            homeBtn.setOnClickListener(v -> {
                getBridge().getWebView().evaluateJavascript("window.location.href='/menus';", null);
                hideOverlay();
            });

            getActivity().addContentView(overlayLayout, new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
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