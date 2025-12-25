package com.bumbaskitchen.app;

import android.os.Bundle;
import android.graphics.Color; // ★ এই লাইনটি নতুন
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
        // ১. থিম পরিবর্তন (XML লেভেলে)
        setTheme(R.style.AppTheme_NoActionBar);

        // ২. Edge-to-Edge এনাবল করা
        EdgeToEdge.enable(this);

        // ৩. প্লাগিন রেজিস্টার
        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);

        super.onCreate(savedInstanceState);

        // ★★★ লোগো সমস্যার চূড়ান্ত সমাধান (THE ULTIMATE FIX) ★★★
        // আমরা প্রোগ্রামিং করে উইন্ডোর ব্যাকগ্রাউন্ড সাদা করে দিচ্ছি।
        // এতে পেছনের স্প্ল্যাশ ইমেজটি মেমরি থেকে মুছে যাবে।
        try {
            getWindow().getDecorView().setBackgroundColor(Color.WHITE);
            getWindow().setBackgroundDrawableResource(android.R.color.white);
        } catch (Exception e) {
            // যদি কোনো কারণে কালার সেট না হয়, ইগনোর করুন
        }

        // ৪. সেফ এরিয়া প্যাডিং (স্ট্যাটাস বারের জন্য)
        View rootView = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(rootView, (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
    }
}