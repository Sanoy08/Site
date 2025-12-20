package com.bumbaskitchen.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

// অন্য প্লাগিনগুলোর সাথে এই নতুন ইম্পোর্টটি যোগ করুন
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.capacitorjs.plugins.app.AppPlugin;
import com.getcapacitor.community.fcm.FCMPlugin;
import io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthentication; // ★ এটি মিসিং ছিল

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // এখানে নতুন প্লাগিনটি রেজিস্টার করুন
        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);
        registerPlugin(FirebaseAuthentication.class); // ★ এই লাইনটি যোগ করুন

        super.onCreate(savedInstanceState);
    }
}