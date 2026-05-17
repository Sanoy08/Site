package com.bumbaskitchen.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.view.ViewGroup;
import android.widget.RelativeLayout;
import android.os.Handler;
import android.os.Looper;

// ★ Lottie ইম্পোর্ট
import com.airbnb.lottie.LottieAnimationView;
import com.airbnb.lottie.LottieDrawable; // ★ লুপ করার জন্য এই নতুন ইম্পোর্টটি লাগবে

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
        // ★ স্মার্ট স্প্ল্যাশ স্ক্রিন (Dynamic Webview Loading)
        // ==========================================
        
        // ১. একটা লেআউট (পর্দা) বানালাম
        RelativeLayout splashLayout = new RelativeLayout(this);
        splashLayout.setBackgroundColor(android.graphics.Color.parseColor("#F8F9FA"));
        splashLayout.setElevation(100f); 
        
        // ২. Lottie অ্যানিমেশন সেটআপ
        LottieAnimationView lottieView = new LottieAnimationView(this);
        lottieView.setAnimation(R.raw.splash_anim);
        lottieView.playAnimation();    
        
        // ★ ম্যাজিক ১: অ্যানিমেশন ইনফিনিট (Infinite) লুপে চলতে থাকবে
        lottieView.setRepeatCount(LottieDrawable.INFINITE);  

        // অ্যানিমেশনের সাইজ (350dp)
        int size = (int) (350 * getResources().getDisplayMetrics().density);
        RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(size, size);
        params.addRule(RelativeLayout.CENTER_IN_PARENT, RelativeLayout.TRUE);
        splashLayout.addView(lottieView, params);

        // ৩. এই পর্দাটাকে মেইন অ্যাপের ঠিক ওপরে বসিয়ে দিলাম
        addContentView(splashLayout, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // ★ ম্যাজিক ২: ডাইনামিক লোডিং চেকার (Dynamic Polling)
        Handler handler = new Handler(Looper.getMainLooper());
        Runnable checkLoading = new Runnable() {
            @Override
            public void run() {
                WebView webView = bridge.getWebView();
                
                // ওয়েবভিউ ১০০% লোড হয়েছে কিনা চেক করা হচ্ছে
                if (webView != null && webView.getProgress() == 100) {
                    
                    // ১০০% লোড হওয়ার পর React/Next.js-কে UI রেন্ডার করার জন্য এক্সট্রা ১ সেকেন্ড সময় দেওয়া হলো
                    handler.postDelayed(() -> {
                        if (splashLayout.getParent() != null) {
                            splashLayout.animate()
                                    .alpha(0f)
                                    .setDuration(500)
                                    .withEndAction(() -> {
                                        ((ViewGroup) splashLayout.getParent()).removeView(splashLayout);
                                    })
                                    .start();
                        }
                    }, 1000); 

                } else {
                    // এখনো লোড হয়নি, তাই ৩০০ মিলি-সেকেন্ড পর আবার চেক করবে
                    handler.postDelayed(this, 300);
                }
            }
        };

        // অ্যাপ ওপেন হওয়ার ৫০০ মিলি-সেকেন্ড পর থেকে লোডিং চেক করা শুরু হবে
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