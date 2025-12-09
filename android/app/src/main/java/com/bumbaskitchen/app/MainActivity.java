package com.bumbaskitchen.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin; // ইম্পোর্ট

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // ম্যানুয়ালি প্লাগিন রেজিস্টার করা হচ্ছে
        registerPlugin(PushNotificationsPlugin.class);
    }
}