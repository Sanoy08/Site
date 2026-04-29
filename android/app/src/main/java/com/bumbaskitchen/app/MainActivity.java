package com.bumbaskitchen.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

// Plugins
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.capacitorjs.plugins.app.AppPlugin;
import com.getcapacitor.community.fcm.FCMPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // ১. ডিফল্ট EdgeToEdge ইনেবল রাখুন
        EdgeToEdge.enable(this);

        // ২. প্লাগিন রেজিস্টার
        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);

        super.onCreate(savedInstanceState);

        // ৩. স্ক্রলবার বন্ধ করার লজিক (ঠিক আছে)
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            
            // ★ ইনপুট ফোকাসের সময় গ্লিচ কমানোর জন্য ওভারস্ক্রোল মোড বন্ধ করা
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        }

        // ★ ৪. রুট ভিউ প্যাডিং লজিকটি রিমুভ করা হয়েছে ★
        // কারণ Capacitor-এর নিজস্ব ইনসেট হ্যান্ডলিং এবং 
        // capacitor.config.ts এর Keyboard resize লজিকের সাথে এটি সংঘাত তৈরি করছে।
    }
}