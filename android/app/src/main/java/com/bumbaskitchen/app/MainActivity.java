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

// ★ নেটওয়ার্ক ও অন্যান্য UI
import android.content.Context;
import android.content.SharedPreferences;
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
import android.graphics.drawable.GradientDrawable; 

// ★ ফন্ট লোড করার জন্য
import androidx.core.content.res.ResourcesCompat;

import com.getcapacitor.BridgeActivity;

// Plugins
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.capacitorjs.plugins.app.AppPlugin;
import com.getcapacitor.community.fcm.FCMPlugin;

public class MainActivity extends BridgeActivity {
    
    private int currentStep = 0;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {

        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);
        registerPlugin(NativeSuccessPlugin.class);

        super.onCreate(savedInstanceState);

        Typeface poppinsBold = null;
        Typeface poppinsMedium = null;
        try {
            poppinsBold = ResourcesCompat.getFont(this, R.font.poppins_bold);
            poppinsMedium = ResourcesCompat.getFont(this, R.font.poppins_medium);
        } catch (Exception e) {}

        // ==========================================
        // ★ ০. NATIVE ONBOARDING SCREEN 
        // ==========================================
        SharedPreferences prefs = getSharedPreferences("BumbasPrefs", MODE_PRIVATE);
        boolean isFirstRun = prefs.getBoolean("isFirstRun", true);

        if (isFirstRun) {
            RelativeLayout onboardLayout = new RelativeLayout(this);
            onboardLayout.setBackgroundColor(Color.parseColor("#FFFFFF"));
            onboardLayout.setElevation(150f); 
            onboardLayout.setClickable(true);
            onboardLayout.setFocusable(true);

            TextView skipBtn = new TextView(this);
            skipBtn.setText("Skip");
            skipBtn.setTextColor(Color.parseColor("#94a3b8"));
            skipBtn.setTextSize(16f);
            if (poppinsBold != null) skipBtn.setTypeface(poppinsBold);
            else skipBtn.setTypeface(null, Typeface.BOLD);
            
            skipBtn.setPadding(40, 60, 60, 40);
            RelativeLayout.LayoutParams skipParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            skipParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
            onboardLayout.addView(skipBtn, skipParams);

            LinearLayout centerBox = new LinearLayout(this);
            centerBox.setOrientation(LinearLayout.VERTICAL);
            centerBox.setGravity(Gravity.CENTER);
            RelativeLayout.LayoutParams boxParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            boxParams.addRule(RelativeLayout.CENTER_IN_PARENT);
            onboardLayout.addView(centerBox, boxParams);

            LottieAnimationView onboardLottie = new LottieAnimationView(this);
            onboardLottie.setRepeatCount(LottieDrawable.INFINITE);
            int lSize = (int) (320 * getResources().getDisplayMetrics().density);
            centerBox.addView(onboardLottie, new LinearLayout.LayoutParams(lSize, lSize));

            TextView titleText = new TextView(this);
            titleText.setTextSize(26f);
            titleText.setTextColor(Color.parseColor("#0f172a"));
            if (poppinsBold != null) titleText.setTypeface(poppinsBold);
            else titleText.setTypeface(null, Typeface.BOLD);
            
            titleText.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams tParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            tParams.setMargins(50, 20, 50, 10);
            centerBox.addView(titleText, tParams);

            TextView descText = new TextView(this);
            descText.setTextSize(16f);
            descText.setTextColor(Color.parseColor("#64748b"));
            descText.setGravity(Gravity.CENTER);
            descText.setLineSpacing(0, 1.2f);
            if (poppinsMedium != null) descText.setTypeface(poppinsMedium);
            
            LinearLayout.LayoutParams dParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            dParams.setMargins(80, 10, 80, 80);
            centerBox.addView(descText, dParams);

            Button nextBtn = new Button(this);
            GradientDrawable btnShape = new GradientDrawable();
            btnShape.setShape(GradientDrawable.RECTANGLE);
            btnShape.setColor(Color.parseColor("#6a9c27"));
            btnShape.setCornerRadius(100f);
            nextBtn.setBackground(btnShape);
            
            nextBtn.setTextColor(Color.WHITE);
            nextBtn.setTextSize(17f);
            if (poppinsBold != null) nextBtn.setTypeface(poppinsBold);
            else nextBtn.setTypeface(null, Typeface.BOLD);
            nextBtn.setElevation(10f); 
            nextBtn.setAllCaps(false); 
            
            RelativeLayout.LayoutParams btnParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, (int)(60 * getResources().getDisplayMetrics().density));
            btnParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
            btnParams.setMargins(70, 0, 70, 100);
            onboardLayout.addView(nextBtn, btnParams);

            addContentView(onboardLayout, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

            Runnable updateContent = () -> {
                if (currentStep == 0) {
                    onboardLottie.setAnimation(R.raw.onboard_order);
                    titleText.setText("Order Your Favorites");
                    descText.setText("Choose from a wide variety of authentic Bengali dishes right from your phone.");
                    nextBtn.setText("Continue");
                } else if (currentStep == 1) {
                    onboardLottie.setAnimation(R.raw.onboard_rider);
                    titleText.setText("Fast & Trackable");
                    descText.setText("Track your food in real-time on the map while our rider is on the way.");
                    nextBtn.setText("Next");
                } else {
                    onboardLottie.setAnimation(R.raw.onboard_delivery);
                    titleText.setText("Delivered to Doorstep");
                    descText.setText("Hot and fresh food delivered safely to you. Enjoy your meal!");
                    nextBtn.setText("Get Started");
                }
                onboardLottie.playAnimation();
            };

            updateContent.run();

            Runnable finishOnboarding = () -> {
                prefs.edit().putBoolean("isFirstRun", false).apply();
                onboardLayout.animate().alpha(0f).setDuration(400).withEndAction(() -> {
                    if (onboardLayout.getParent() != null) ((ViewGroup) onboardLayout.getParent()).removeView(onboardLayout);
                    if (bridge.getWebView() != null) bridge.getWebView().loadUrl("https://www.bumbaskitchen.app/login");
                }).start();
            };

            nextBtn.setOnClickListener(v -> {
                nextBtn.animate().scaleX(0.95f).scaleY(0.95f).setDuration(100).withEndAction(() -> {
                    nextBtn.animate().scaleX(1f).scaleY(1f).setDuration(100).start();
                    if (currentStep < 2) {
                        currentStep++;
                        centerBox.animate().alpha(0f).translationY(-20f).setDuration(200).withEndAction(() -> {
                            updateContent.run();
                            centerBox.setTranslationY(20f);
                            centerBox.animate().alpha(1f).translationY(0f).setDuration(250).start();
                        }).start();
                    } else finishOnboarding.run();
                }).start();
            });

            skipBtn.setOnClickListener(v -> finishOnboarding.run());
        }

        // ==========================================
        // ★ ১. স্মার্ট স্প্ল্যাশ স্ক্রিন
        // ==========================================
        RelativeLayout splashLayout = new RelativeLayout(this);
        splashLayout.setBackgroundColor(Color.parseColor("#F8F9FA"));
        splashLayout.setElevation(100f); 
        splashLayout.setClickable(true);
        splashLayout.setFocusable(true);
        
        LottieAnimationView splashLottie = new LottieAnimationView(this);
        splashLottie.setAnimation(R.raw.splash_anim);
        splashLottie.setRepeatCount(LottieDrawable.INFINITE);  
        splashLottie.playAnimation();    

        int size = (int) (350 * getResources().getDisplayMetrics().density);
        RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(size, size);
        params.addRule(RelativeLayout.CENTER_IN_PARENT, RelativeLayout.TRUE);
        splashLayout.addView(splashLottie, params);

        addContentView(splashLayout, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        final boolean[] isWebLoaded = {false};
        final boolean[] isSplashRemoved = {false};

        Runnable removeSplash = () -> {
            if (isSplashRemoved[0]) return;
            isSplashRemoved[0] = true;
            splashLottie.cancelAnimation();
            splashLayout.animate().alpha(0f).setDuration(500).withEndAction(() -> {
                if (splashLayout.getParent() != null) ((ViewGroup) splashLayout.getParent()).removeView(splashLayout);
            }).start();
        };

        // ★ MAGIC FRAME CALLBACK (৯০ নম্বর ফ্রেমে চেক করবে)
        splashLottie.addAnimatorUpdateListener(animation -> {
            if (isWebLoaded[0] && splashLottie.getFrame() >= 90) {
                removeSplash.run();
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
        offlineLayout.setClickable(true);
        offlineLayout.setFocusable(true);

        LinearLayout centerBox = new LinearLayout(this);
        centerBox.setOrientation(LinearLayout.VERTICAL);
        centerBox.setGravity(Gravity.CENTER);
        RelativeLayout.LayoutParams boxParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        boxParams.addRule(RelativeLayout.CENTER_IN_PARENT, RelativeLayout.TRUE);
        offlineLayout.addView(centerBox, boxParams);

        LottieAnimationView offlineLottie = new LottieAnimationView(this);
        offlineLottie.setAnimation(R.raw.no_internet_anim);
        offlineLottie.setRepeatCount(LottieDrawable.INFINITE);
        offlineLottie.playAnimation();
        int lSize = (int) (250 * getResources().getDisplayMetrics().density);
        centerBox.addView(offlineLottie, new LinearLayout.LayoutParams(lSize, lSize));

        TextView offlineTitleText = new TextView(this);
        offlineTitleText.setText("No Internet Connection");
        offlineTitleText.setTextSize(22f);
        offlineTitleText.setTextColor(Color.parseColor("#1e293b"));
        if (poppinsBold != null) offlineTitleText.setTypeface(poppinsBold);
        else offlineTitleText.setTypeface(null, Typeface.BOLD);
        offlineTitleText.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams tParamsOffline = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        tParamsOffline.setMargins(0, 20, 0, 50);
        centerBox.addView(offlineTitleText, tParamsOffline);

        Button retryBtn = new Button(this);
        GradientDrawable retryShape = new GradientDrawable();
        retryShape.setShape(GradientDrawable.RECTANGLE);
        retryShape.setColor(Color.parseColor("#6a9c27"));
        retryShape.setCornerRadius(100f); 
        retryBtn.setBackground(retryShape);
        retryBtn.setText("Try Again");
        retryBtn.setTextColor(Color.WHITE);
        retryBtn.setAllCaps(false);
        if (poppinsBold != null) retryBtn.setTypeface(poppinsBold);
        else retryBtn.setTypeface(null, Typeface.BOLD);
        retryBtn.setPadding(80, 20, 80, 20);
        retryBtn.setOnClickListener(v -> {
            retryBtn.animate().scaleX(0.95f).scaleY(0.95f).setDuration(100).withEndAction(() -> {
                retryBtn.animate().scaleX(1f).scaleY(1f).setDuration(100).start();
                if (bridge.getWebView() != null) bridge.getWebView().loadUrl("https://www.bumbaskitchen.app");
            }).start();
        });
        centerBox.addView(retryBtn, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        addContentView(offlineLayout, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkRequest networkRequest = new NetworkRequest.Builder().addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET).build();

        connectivityManager.registerNetworkCallback(networkRequest, new ConnectivityManager.NetworkCallback() {
            @Override public void onAvailable(Network network) {
                runOnUiThread(() -> {
                    offlineLayout.setVisibility(View.GONE);
                    if (bridge.getWebView() != null) bridge.getWebView().loadUrl("https://www.bumbaskitchen.app");
                });
            }
            @Override public void onLost(Network network) {
                runOnUiThread(() -> offlineLayout.setVisibility(View.VISIBLE));
            }
        });

        try {
            android.net.NetworkInfo activeNetwork = connectivityManager.getActiveNetworkInfo();
            if (activeNetwork == null || !activeNetwork.isConnectedOrConnecting()) offlineLayout.setVisibility(View.VISIBLE);
        } catch (Exception e) {}

        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        }
    }
}