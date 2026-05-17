package com.bumbaskitchen.app;

import android.os.Bundle;
import android.webkit.WebView;
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

        // ২. Android Native WebView থেকে স্ক্রলবার বন্ধ করা এবং ওভারস্ক্রোল গ্লিচ অফ করা
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER); // ★ গ্লিচ রিমুভার
        }
    }
}