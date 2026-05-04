// android/app/src/main/java/com/bumbaskitchen/app/MainActivity.java

package com.bumbaskitchen.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.view.Window;
import android.graphics.Color;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

// Plugins
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.capacitorjs.plugins.app.AppPlugin;
import com.getcapacitor.community.fcm.FCMPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {

        // ✅ 1. Plugins register (same as yours)
        registerPlugin(AppPlugin.class);
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMPlugin.class);

        super.onCreate(savedInstanceState);

        // ✅ 2. EDGE-TO-EDGE enable (🔥 main part)
        Window window = getWindow();

        // Content status bar er niche jabe
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // Status bar fully transparent
        window.setStatusBarColor(Color.TRANSPARENT);

        // Navigation bar optional (same look)
        window.setNavigationBarColor(Color.TRANSPARENT);

        // ✅ 3. Status bar icon style (initial = light bg dhore dark icon)
        WindowInsetsControllerCompat controller =
                new WindowInsetsControllerCompat(window, window.getDecorView());

        controller.setAppearanceLightStatusBars(false); 
        // false = white icons (dark background er jonno perfect initial state)

        // ✅ 4. WebView tuning (same as yours + optimized)
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);

            // Optional: smoother rendering
            webView.setBackgroundColor(Color.TRANSPARENT);
        }
    }
}