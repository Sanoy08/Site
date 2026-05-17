package com.bumbaskitchen.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.view.ViewGroup;
import android.widget.RelativeLayout;
import android.os.Handler;
import android.os.Looper;

// ★ Lottie ইম্পোর্ট
import com.airbnb.lottie.LottieAnimationView; 

import com.getcapacitor.BridgeActivity;

// Plugins
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.capacitorjs.plugins.app.AppPlugin;
import com.getcapacitor.community.fcm.FCMPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // ★ EdgeToEdge রিমুভ করা হয়েছে যাতে স্ট্যাটাস বার নিয়ে কোনো কালো ওভারলে না আসে

        // ১. Register Plugins
        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);

        super.onCreate(savedInstanceState);

        // ==========================================
        // ★ স্মার্ট স্প্ল্যাশ স্ক্রিন ওভারলে (Background Loading)
        // ==========================================
        
        // ১. একটা লেআউট (পর্দা) বানালাম যার কালার অফ-হোয়াইট
        RelativeLayout splashLayout = new RelativeLayout(this);
        splashLayout.setBackgroundColor(android.graphics.Color.parseColor("#F8F9FA"));
        splashLayout.setElevation(100f); // যাতে এটা সবার উপরে থাকে
        
        // ২. Lottie অ্যানিমেশন সেটআপ
        LottieAnimationView lottieView = new LottieAnimationView(this);
        lottieView.setAnimation(R.raw.splash_anim);
        lottieView.playAnimation();    // ★ অ্যানিমেশন অটোমেটিক স্টার্ট করার জন্য
        lottieView.setRepeatCount(0);  // ★ 0 মানে শুধু একবার প্লে হবে, লুপ হবে না

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

        // ৪. ৩.৫ সেকেন্ড পর পর্দাটা গায়েব করে দেবো
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            splashLayout.animate()
                    .alpha(0f)
                    .setDuration(500)
                    .withEndAction(() -> {
                        ((ViewGroup) splashLayout.getParent()).removeView(splashLayout);
                    })
                    .start();
        }, 3500); 
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