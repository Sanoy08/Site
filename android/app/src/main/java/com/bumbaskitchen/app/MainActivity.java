package com.bumbaskitchen.app;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;
import android.graphics.Color;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

// Plugins
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.capacitorjs.plugins.app.AppPlugin;
import com.getcapacitor.community.fcm.FCMPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        
        // ★★★ 1. Notch / Cutout Area তে অ্যাপ ড্র করার পারমিশন (সাদা/গ্রে বার রিমুভার) ★★★
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        super.onCreate(savedInstanceState);

        // ★★★ 2. Edge-to-Edge Fullscreen এবং Transparent Background ★★★
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        // getWindow().setNavigationBarColor(Color.TRANSPARENT); // আপনি চাইলে নিচের নেভিগেশন বারও ট্রান্সপারেন্ট করতে পারেন

        // Register Plugins
        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);

        // WebView Scroll and Glitch fixes
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER); // গ্লিচ রিমুভার
        }
    }
}