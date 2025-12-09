package com.bumbaskitchen.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

// প্লাগিন ইম্পোর্ট
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.capacitorjs.plugins.app.AppPlugin;
import com.getcapacitor.community.fcm.FCMPlugin; 

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // ম্যানুয়ালি প্লাগিন রেজিস্টার করুন (Super কল করার আগে বা পরে, সাধারণত অটোমেটিক হয়, তবে ফোর্স করার জন্য এখানে দিলাম)
        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);

        super.onCreate(savedInstanceState);
    }
}