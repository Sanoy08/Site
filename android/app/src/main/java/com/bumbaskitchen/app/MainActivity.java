package com.bumbaskitchen.app;

import android.os.Bundle;
import android.view.View;
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
        // ★★★ 1. LOGO FIX (CRITICAL) ★★★
        // অ্যাপ স্টার্ট হওয়ার সাথে সাথে স্প্ল্যাশ থিম সরিয়ে মেইন থিম (সাদা ব্যাকগ্রাউন্ড) সেট করা হচ্ছে।
        // এটি "Half Screen Logo" সমস্যাটি ১০০% সমাধান করবে।
        setTheme(R.style.AppTheme_NoActionBar);

        // 2. Enable Edge-to-Edge (Required for Android 15+)
        // This makes system bars transparent and allows us to control the background
        EdgeToEdge.enable(this);

        // 3. Register Plugins
        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);

        super.onCreate(savedInstanceState);

        // 4. Apply Global Top Padding (Safe Area)
        // This listener finds the exact height of the Status Bar and pushes the WebView down
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