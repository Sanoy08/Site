package com.bumbaskitchen.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView; 
import android.graphics.Color; // ★ কালার ইমপোর্ট করা হলো
import android.graphics.drawable.ColorDrawable; // ★ ব্যাকগ্রাউন্ড ড্রয়েবল ইমপোর্ট করা হলো
import androidx.activity.EdgeToEdge;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

// Plugins
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.capacitorjs.plugins.app.AppPlugin;
import com.getcapacitor.community.fcm.FCMPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 1. Enable Edge-to-Edge (Required for Android 15+)
        EdgeToEdge.enable(this);

        // 2. Register Plugins
        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);

        super.onCreate(savedInstanceState);

        // ★ 3. ব্যাকগ্রাউন্ড লোগো ফিক্স: পেছনের ব্যাকগ্রাউন্ড সাদা করে দেওয়া হলো ★
        getWindow().setBackgroundDrawable(new ColorDrawable(Color.WHITE));

        // 4. Android Native WebView থেকে স্ক্রলবার চিরতরে বন্ধ করার কোড
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            
            // ★ WebView এর নিজস্ব ব্যাকগ্রাউন্ডও সাদা করে দেওয়া হলো ★
            webView.setBackgroundColor(Color.WHITE);
        }

        // 5. Apply Global Top Padding (Safe Area)
        View rootView = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(rootView, (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            
            // Apply padding: Left, Top (Status Bar), Right, Bottom (Nav Bar)
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            
            // Return CONSUMED to prevent double-padding
            return WindowInsetsCompat.CONSUMED;
        });
    }
}