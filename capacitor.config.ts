// capacitor.config.ts

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
    // ★ adjustMarginsForEdgeToEdge বাদ দেওয়া হলো যাতে ফুলস্ক্রিন হয়
    zoomEnabled: false,
    backgroundColor: "#F8F9FA"
  },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: false, 
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
    SplashScreen: {
      launchShowDuration: 1000, 
      launchAutoHide: true,     
      backgroundColor: "#F8F9FA",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      // ★ স্প্ল্যাশ স্ক্রিনকেও এজ-টু-এজ এবং ইমারসিভ করার জন্য এই দুটো true করতে হবে
      splashFullScreen: true, 
      splashImmersive: true   
    }
  }
};

export default config;