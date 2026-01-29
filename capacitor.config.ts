// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
// ★ ইম্পোর্ট করতে হবে (যদি এরর দেয়, তাহলে `npm install @capacitor/status-bar` দিন)
import { Style } from '@capacitor/status-bar'; 

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
    // @ts-ignore
    adjustMarginsForEdgeToEdge: 'disable',
    zoomEnabled: false,
    backgroundColor: "#7D9A4D" 
  },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
    // ★★★ STATUS BAR SETTINGS (New) ★★★
    StatusBar: {
      style: Style.Light, // আইকন কালো হবে (Light Style মানে ব্যাকগ্রাউন্ড লাইট)
      backgroundColor: '#FFFFFF', // ব্যাকগ্রাউন্ড সাদা
      overlaysWebView: false, // ওয়েবভিউ এর উপরে ভাসবে না
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
    SplashScreen: {
      launchShowDuration: 0, // স্প্ল্যাশ স্ক্রিন বেশিক্ষণ আটকে থাকবে না
      launchAutoHide: false,
      backgroundColor: "#7D9A4D",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    }
  }
};

export default config;