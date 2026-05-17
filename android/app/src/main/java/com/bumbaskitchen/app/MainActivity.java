package com.bumbaskitchen.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.view.ViewGroup;
import android.widget.RelativeLayout;
import android.os.Handler;
import android.os.Looper;

// ★ Lottie ও Animator ইম্পোর্ট
import com.airbnb.lottie.LottieAnimationView;
import com.airbnb.lottie.LottieDrawable;
import android.animation.Animator;

// ★ নেটওয়ার্ক চেকের জন্য ইম্পোর্ট
import android.content.Context;
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
    @Override
    public void onCreate(Bundle savedInstanceState) {

        // ১. Register Plugins
        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);

        super.onCreate(savedInstanceState);

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
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

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
        // ★ ২. NATIVE OFFLINE SCREEN (Direct App UI)
        // ==========================================
        
        RelativeLayout offlineLayout = new RelativeLayout(this);
        offlineLayout.setBackgroundColor(Color.parseColor("#F8F9FA"));
        offlineLayout.setElevation(110f); // স্প্ল্যাশের ওপরে থাকবে
        offlineLayout.setVisibility(View.GONE);

        LinearLayout centerBox = new LinearLayout(this);
        centerBox.setOrientation(LinearLayout.VERTICAL);
        centerBox.setGravity(Gravity.CENTER);
        RelativeLayout.LayoutParams boxParams = new RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        boxParams.addRule(RelativeLayout.CENTER_IN_PARENT, RelativeLayout.TRUE);
        offlineLayout.addView(centerBox, boxParams);

        // Lottie Setup for Offline
        LottieAnimationView offlineLottie = new LottieAnimationView(this);
        offlineLottie.setAnimation(R.raw.no_internet_anim); // ★ তোমার নতুন ফাইল
        offlineLottie.setRepeatCount(LottieDrawable.INFINITE);
        offlineLottie.playAnimation();
        int lSize = (int) (250 * getResources().getDisplayMetrics().density);
        LinearLayout.LayoutParams lParams = new LinearLayout.LayoutParams(lSize, lSize);
        centerBox.addView(offlineLottie, lParams);

        // Text Setup
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

        // Try Again Button
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
        LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        centerBox.addView(retryBtn, btnParams);

        addContentView(offlineLayout, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // ★ ৩. Live Network Tracker
        ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkRequest networkRequest = new NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build();

        connectivityManager.registerNetworkCallback(networkRequest, new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                runOnUiThread(() -> {
                    offlineLayout.setVisibility(View.GONE);
                    // ইন্টারনেট এলে ওয়েবসাইট অটোমেটিক রিলোড হবে
                    if (bridge.getWebView() != null) {
                        bridge.getWebView().loadUrl("https://www.bumbaskitchen.app");
                    }
                });
            }

            @Override
            public void onLost(Network network) {
                runOnUiThread(() -> {
                    // ইন্টারনেট গেলে অ্যানিমেশন স্ক্রিন চলে আসবে
                    offlineLayout.setVisibility(View.VISIBLE);
                });
            }
        });

        // অ্যাপ খোলার সময় প্রথমবার চেক করা
        try {
            android.net.NetworkInfo activeNetwork = connectivityManager.getActiveNetworkInfo();
            if (activeNetwork == null || !activeNetwork.isConnectedOrConnecting()) {
                offlineLayout.setVisibility(View.VISIBLE);
            }
        } catch (Exception e) {}
        // ==========================================

        // Android Native WebView থেকে স্ক্রলবার বন্ধ করা
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        }
    }
}