package com.bumbaskitchen.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.view.Window;
import android.view.WindowManager;
import android.graphics.Color;
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

        // ★★★ FULLSCREEN EDGE-TO-EDGE MAGIC ★★★
        Window window = getWindow();
        // এটি স্ট্যাটাস বার এবং ন্যাভিগেশন বারের সীমানা ভেঙে অ্যাপকে পুরো স্ক্রিনে ছড়িয়ে দেবে
        window.setFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        // স্ট্যাটাস বারের ব্যাকগ্রাউন্ড কালার পুরোপুরি ট্রান্সপারেন্ট করে দেওয়া হলো
        window.setStatusBarColor(Color.TRANSPARENT);

        // ২. Android Native WebView থেকে স্ক্রলবার বন্ধ করা এবং ওভারস্ক্রোল গ্লিচ অফ করা
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER); // ★ গ্লিচ রিমুভার
        }
    }
}