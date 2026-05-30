import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.bumbaskitchen.app',
  appName: "Bumba's Kitchen",
  webDir: 'public',
  server: {
    url: 'https://www.bumbaskitchen.app',
    cleartext: true,
    allowNavigation: [
      'www.bumbaskitchen.app',
      'bumbaskitchen.app',
      '*.bumbaskitchen.app'
    ],
  },
  android: {
    zoomEnabled: false,
    backgroundColor: "#F8F9FA",
    appendUserAgent: "BumbasKitchenApp-Native" // ★ ম্যাজিক: এই সিক্রেট সিগন্যালটা অ্যাড করা হলো
  },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: false,
    },
    // ★ MAGIC 3: Force the webview to overlay the top status bar natively
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK', // Uses dark text/icons for time & battery. Use 'LIGHT' if your top banner is dark.
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#F8F9FA",
      showSpinner: false
    }
  }
};

export default config;