package com.bumbaskitchen.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

// Existing Imports (Keep these)
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.capacitorjs.plugins.app.AppPlugin;
import com.getcapacitor.community.fcm.FCMPlugin; 

// ★ NEW Import for Google Auth (Add this)
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Existing Plugins (Keep these)
        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);

        // ★ NEW Plugin Registration (Add this)
        registerPlugin(GoogleAuth.class);
    }
}