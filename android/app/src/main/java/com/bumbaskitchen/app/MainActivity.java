package com.bumbaskitchen.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

// ১. এই ইম্পোর্টগুলো যোগ করুন
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.capacitorjs.plugins.app.AppPlugin;
import com.getcapacitor.community.fcm.FCMPlugin; 

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // ২. এই লাইনগুলো যোগ করুন (Super এর আগে বা পরে)
        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);

        super.onCreate(savedInstanceState);
    }
}