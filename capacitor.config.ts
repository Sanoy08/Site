import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bumbaskitchen.app',
  appName: "Bumba's Kitchen",
  webDir: 'public',
  server: {
    url: 'https://www.bumbaskitchen.app', // ★ এই লাইনটি আবার চালু করুন
    cleartext: true,
    allowNavigation: [
      'www.bumbaskitchen.app',
      'bumbaskitchen.app',
      '*.bumbaskitchen.app'
    ]
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    // ★ এটি যোগ করুন
    StatusBar: {
      style: "light",
      overlaysWebView: true, // আমরা CSS দিয়ে হ্যান্ডেল করবো
      backgroundColor: "#ffffffff"
    }
  }
};

export default config;