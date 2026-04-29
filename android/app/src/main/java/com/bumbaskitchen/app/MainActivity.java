package com.bumbaskitchen.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge; // ★ ইমপোর্ট করুন
import com.getcapacitor.BridgeActivity;

// Plugins
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.capacitorjs.plugins.app.AppPlugin;
import com.getcapacitor.community.fcm.FCMPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // ★ ১. Edge-to-Edge ইনেবল করা হলো (এটিই মেইনFullscreen করবে)
        EdgeToEdge.enable(this);

        // ২. Register Plugins
        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);

        super.onCreate(savedInstanceState);

        // ৩. WebView সেটিংস
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        }
    }
}