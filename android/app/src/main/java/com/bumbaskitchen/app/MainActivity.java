package com.bumbaskitchen.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.view.ViewGroup;
import android.widget.RelativeLayout;
import android.os.Handler;
import android.os.Looper;

// ★ Lottie ও Animator
import com.airbnb.lottie.LottieAnimationView;
import com.airbnb.lottie.LottieDrawable;
import android.animation.Animator;

// ★ নেটওয়ার্ক ও অন্যান্য UI
import android.content.Context;
import android.content.SharedPreferences; // ★ First Run ট্র‍্যাক করার জন্য
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.view.View;
import android.graphics.Color;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;
import android.view.Gravity;
import android.graphics.Typeface;

import com.getcapacitor.BridgeActivity;

// Plugins
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.capacitorjs.plugins.app.AppPlugin;
import com.getcapacitor.community.fcm.FCMPlugin;

public class MainActivity extends BridgeActivity {
    
    // Onboarding Trackers
    private int currentStep = 0;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {

        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);

        super.onCreate(savedInstanceState);

        // ==========================================
        // ★ ০. NATIVE ONBOARDING SCREEN (First Time Only)
        // ==========================================
        SharedPreferences prefs = getSharedPreferences("BumbasPrefs", MODE_PRIVATE);
        boolean isFirstRun = prefs.getBoolean("isFirstRun", true);

        if (isFirstRun) {
            RelativeLayout onboardLayout = new RelativeLayout(this);
            onboardLayout.setBackgroundColor(Color.parseColor("#FFFFFF"));
            onboardLayout.setElevation(150f); // সবার উপরে থাকবে

            // Skip Button
            TextView skipBtn = new TextView(this);
            skipBtn.setText("Skip");
            skipBtn.setTextColor(Color.parseColor("#64748b"));
            skipBtn.setTextSize(16f);
            skipBtn.setPadding(40, 60, 40, 40);
            RelativeLayout.LayoutParams skipParams = new RelativeLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            skipParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
            onboardLayout.addView(skipBtn, skipParams);

            // Center Content (Lottie + Text)
            LinearLayout centerBox = new LinearLayout(this);
            centerBox.setOrientation(LinearLayout.VERTICAL);
            centerBox.setGravity(Gravity.CENTER);
            RelativeLayout.LayoutParams boxParams = new RelativeLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            boxParams.addRule(RelativeLayout.CENTER_IN_PARENT);
            onboardLayout.addView(centerBox, boxParams);

            LottieAnimationView onboardLottie = new LottieAnimationView(this);
            onboardLottie.setRepeatCount(LottieDrawable.INFINITE);
            int lSize = (int) (300 * getResources().getDisplayMetrics().density);
            centerBox.addView(onboardLottie, new LinearLayout.LayoutParams(lSize, lSize));

            TextView titleText = new TextView(this);
            titleText.setTextSize(24f);
            titleText.setTextColor(Color.parseColor("#1e293b"));
            titleText.setTypeface(null, Typeface.BOLD);
            titleText.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams tParams = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            tParams.setMargins(50, 40, 50, 10);
            centerBox.addView(titleText, tParams);

            TextView descText = new TextView(this);
            descText.setTextSize(15f);
            descText.setTextColor(Color.parseColor("#64748b"));
            descText.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams dParams = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            dParams.setMargins(80, 0, 80, 80);
            centerBox.addView(descText, dParams);

            // Next / Login Button
            Button nextBtn = new Button(this);
            nextBtn.setBackgroundColor(Color.parseColor("#6a9c27"));
            nextBtn.setTextColor(Color.WHITE);
            nextBtn.setTextSize(16f);
            nextBtn.setTypeface(null, Typeface.BOLD);
            RelativeLayout.LayoutParams btnParams = new RelativeLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, (int)(55 * getResources().getDisplayMetrics().density));
            btnParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
            btnParams.setMargins(60, 0, 60, 100);
            onboardLayout.addView(nextBtn, btnParams);

            addContentView(onboardLayout, new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

            // Data Update Method
            Runnable updateUI = () -> {
                if (currentStep == 0) {
                    onboardLottie.setAnimation(R.raw.onboard_order);
                    titleText.setText("Order Your Favorites");
                    descText.setText("Choose from a wide variety of authentic Bengali dishes right from your phone.");
                    nextBtn.setText("Next");
                } else if (currentStep == 1) {
                    onboardLottie.setAnimation(R.raw.onboard_rider);
                    titleText.setText("Fast & Trackable");
                    descText.setText("Track your food in real-time on the map while our rider is on the way.");
                    nextBtn.setText("Next");
                } else {
                    onboardLottie.setAnimation(R.raw.onboard_delivery);
                    titleText.setText("Delivered to Doorstep");
                    descText.setText("Hot and fresh food delivered safely to you. Enjoy your meal!");
                    nextBtn.setText("Login to Continue");
                }
                onboardLottie.playAnimation();
            };

            // Initial Load
            updateUI.run();

            // Action: Finish Onboarding
            Runnable finishOnboarding = () -> {
                prefs.edit().putBoolean("isFirstRun", false).apply();
                onboardLayout.animate().alpha(0f).setDuration(400).withEndAction(() -> {
                    if (onboardLayout.getParent() != null) {
                        ((ViewGroup) onboardLayout.getParent()).removeView(onboardLayout);
                    }
                    // ★ সরাসরি Login পেজে রিডাইরেক্ট করে দেওয়া হলো
                    if (bridge.getWebView() != null) {
                        bridge.getWebView().loadUrl("https://www.bumbaskitchen.app/login");
                    }
                }).start();
            };

            nextBtn.setOnClickListener(v -> {
                if (currentStep < 2) {
                    currentStep++;
                    updateUI.run();
                } else {
                    finishOnboarding.run();
                }
            });

            skipBtn.setOnClickListener(v -> finishOnboarding.run());
        }

        // ==========================================
        // ★ ১. স্মার্ট স্প্ল্যাশ স্ক্রিন (আগের কোড)
        // ==========================================
        RelativeLayout splashLayout = new RelativeLayout(this);
        splashLayout.setBackgroundColor(Color.parseColor("#F8F9FA"));
        splashLayout.setElevation(100f); 
        
        LottieAnimationView splashLottie = new LottieAnimationView(this);
        splashLottie.setAnimation(R.raw.splash_anim);
        splashLottie.setRepeatCount(LottieDrawable.INFINITE);  
        splashLottie.playAnimation();    

        int size = (int) (350 * getResources().getDisplayMetrics().density);
        RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(size, size);
        params.addRule(RelativeLayout.CENTER_IN_PARENT, RelativeLayout.TRUE);
        splashLayout.addView(splashLottie, params);

        addContentView(splashLayout, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        final boolean[] isWebLoaded = {false};
        final boolean[] isSplashRemoved = {false};

        Runnable removeSplash = () -> {
            if (isSplashRemoved[0]) return;
            isSplashRemoved[0] = true;
            splashLottie.cancelAnimation();
            splashLayout.animate()
                    .alpha(0f)
                    .setDuration(500)
                    .withEndAction(() -> {
                        if (splashLayout.getParent() != null) {
                            ((ViewGroup) splashLayout.getParent()).removeView(splashLayout);
                        }
                    })
                    .start();
        };

        splashLottie.addAnimatorListener(new Animator.AnimatorListener() {
            @Override public void onAnimationStart(Animator animation) {}
            @Override public void onAnimationEnd(Animator animation) {}
            @Override public void onAnimationCancel(Animator animation) {}
            @Override
            public void onAnimationRepeat(Animator animation) {
                if (isWebLoaded[0]) {
                    removeSplash.run();
                }
            }
        });

        Handler handler = new Handler(Looper.getMainLooper());
        Runnable checkLoading = new Runnable() {
            @Override
            public void run() {
                WebView webView = bridge.getWebView();
                if (webView != null && webView.getProgress() == 100) {
                    isWebLoaded[0] = true; 
                } else {
                    handler.postDelayed(this, 300);
                }
            }
        };
        handler.postDelayed(checkLoading, 500);


        // ==========================================
        // ★ ২. NATIVE OFFLINE SCREEN 
        // ==========================================
        RelativeLayout offlineLayout = new RelativeLayout(this);
        offlineLayout.setBackgroundColor(Color.parseColor("#F8F9FA"));
        offlineLayout.setElevation(110f);
        offlineLayout.setVisibility(View.GONE);

        LinearLayout centerBox = new LinearLayout(this);
        centerBox.setOrientation(LinearLayout.VERTICAL);
        centerBox.setGravity(Gravity.CENTER);
        RelativeLayout.LayoutParams boxParams = new RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        boxParams.addRule(RelativeLayout.CENTER_IN_PARENT, RelativeLayout.TRUE);
        offlineLayout.addView(centerBox, boxParams);

        LottieAnimationView offlineLottie = new LottieAnimationView(this);
        offlineLottie.setAnimation(R.raw.no_internet_anim);
        offlineLottie.setRepeatCount(LottieDrawable.INFINITE);
        offlineLottie.playAnimation();
        int lSize = (int) (250 * getResources().getDisplayMetrics().density);
        centerBox.addView(offlineLottie, new LinearLayout.LayoutParams(lSize, lSize));

        TextView titleText = new TextView(this);
        titleText.setText("No Internet Connection");
        titleText.setTextSize(22f);
        titleText.setTextColor(Color.parseColor("#1e293b"));
        titleText.setTypeface(null, Typeface.BOLD);
        titleText.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams tParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        tParams.setMargins(0, 20, 0, 50);
        centerBox.addView(titleText, tParams);

        Button retryBtn = new Button(this);
        retryBtn.setText("Try Again");
        retryBtn.setBackgroundColor(Color.parseColor("#6a9c27"));
        retryBtn.setTextColor(Color.WHITE);
        retryBtn.setPadding(60, 20, 60, 20);
        retryBtn.setOnClickListener(v -> {
            if (bridge.getWebView() != null) {
                bridge.getWebView().loadUrl("https://www.bumbaskitchen.app");
            }
        });
        centerBox.addView(retryBtn, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        addContentView(offlineLayout, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkRequest networkRequest = new NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build();

        connectivityManager.registerNetworkCallback(networkRequest, new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                runOnUiThread(() -> {
                    offlineLayout.setVisibility(View.GONE);
                    if (bridge.getWebView() != null) {
                        bridge.getWebView().loadUrl("https://www.bumbaskitchen.app");
                    }
                });
            }

            @Override
            public void onLost(Network network) {
                runOnUiThread(() -> {
                    offlineLayout.setVisibility(View.VISIBLE);
                });
            }
        });

        try {
            android.net.NetworkInfo activeNetwork = connectivityManager.getActiveNetworkInfo();
            if (activeNetwork == null || !activeNetwork.isConnectedOrConnecting()) {
                offlineLayout.setVisibility(View.VISIBLE);
            }
        } catch (Exception e) {}

        // ==========================================
        // WebView Scroll Issue Fix
        // ==========================================
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        }
    }
}