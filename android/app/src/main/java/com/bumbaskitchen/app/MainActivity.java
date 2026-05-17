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
import android.animation.Animator; // ★ অ্যানিমেশন সাইকেল ট্র্যাক করার জন্য

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
        // ★ স্মার্ট স্প্ল্যাশ স্ক্রিন (Perfect Animation Cycle Sync)
        // ==========================================
        
        RelativeLayout splashLayout = new RelativeLayout(this);
        splashLayout.setBackgroundColor(android.graphics.Color.parseColor("#F8F9FA"));
        splashLayout.setElevation(100f); 
        
        LottieAnimationView lottieView = new LottieAnimationView(this);
        lottieView.setAnimation(R.raw.splash_anim);
        lottieView.setRepeatCount(LottieDrawable.INFINITE);  
        lottieView.playAnimation();    

        int size = (int) (350 * getResources().getDisplayMetrics().density);
        RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(size, size);
        params.addRule(RelativeLayout.CENTER_IN_PARENT, RelativeLayout.TRUE);
        splashLayout.addView(lottieView, params);

        addContentView(splashLayout, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // ভেরিয়েবল: ওয়েবসাইট লোডিং এবং স্প্ল্যাশ রিমুভ ট্র্যাক করার জন্য
        final boolean[] isWebLoaded = {false};
        final boolean[] isSplashRemoved = {false};

        // স্প্ল্যাশ স্ক্রিন সরানোর ফাংশন
        Runnable removeSplash = () -> {
            if (isSplashRemoved[0]) return; // ডাবল রিমুভ ঠেকানোর জন্য
            isSplashRemoved[0] = true;
            
            lottieView.cancelAnimation(); // অ্যানিমেশন স্টপ করা
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

        // ★ ম্যাজিক ১: Lottie Animation সাইকেল ট্র্যাকার
        lottieView.addAnimatorListener(new Animator.AnimatorListener() {
            @Override
            public void onAnimationStart(Animator animation) {}

            @Override
            public void onAnimationEnd(Animator animation) {}

            @Override
            public void onAnimationCancel(Animator animation) {}

            @Override
            public void onAnimationRepeat(Animator animation) {
                // যখনই একবার অ্যানিমেশন লুপ শেষ হয়ে আবার শুরু হতে যাবে, তখন চেক করবে ওয়েবসাইট রেডি কিনা
                if (isWebLoaded[0]) {
                    removeSplash.run(); // রেডি থাকলে স্প্ল্যাশ সরিয়ে দাও
                }
            }
        });

        // ★ ম্যাজিক ২: ডাইনামিক লোডিং চেকার
        Handler handler = new Handler(Looper.getMainLooper());
        Runnable checkLoading = new Runnable() {
            @Override
            public void run() {
                WebView webView = bridge.getWebView();
                
                // ওয়েবভিউ ১০০% লোড হয়েছে কিনা চেক
                if (webView != null && webView.getProgress() == 100) {
                    isWebLoaded[0] = true; 
                    // এখানে আমরা ডাইরেক্ট removeSplash কল করছি না। 
                    // ওয়েবসাইট লোড হলেও অ্যানিমেশন সাইকেল শেষ হওয়া অব্দি অপেক্ষা করবে!
                } else {
                    handler.postDelayed(this, 300);
                }
            }
        };
        handler.postDelayed(checkLoading, 500);
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