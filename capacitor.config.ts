// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.bumbaskitchen.app',
  appName: "Bumba's Kitchen",
  webDir: 'public',
  server: {
    // এটি মেইন এন্ট্রি পয়েন্ট
    url: 'https://www.bumbaskitchen.app', 
    cleartext: true,
    // এখানে সাবডোমেনগুলো মাস্ট যোগ করতে হবে
    allowNavigation: [
      'www.bumbaskitchen.app',
      'bumbaskitchen.app',
      'admin.bumbaskitchen.app', // এডমিন সাবডোমেন
      '*.bumbaskitchen.app'      // অন্য সব সাবডোমেনের জন্য ওয়াইল্ডকার্ড
    ],
  },
  android: {
    // @ts-ignore
    adjustMarginsForEdgeToEdge: 'disable',
    zoomEnabled: false,
    backgroundColor: "#7D9A4D" // লোডিং এর সময় ব্যাকগ্রাউন্ড কালার
  },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
    // StatusBar কনফিগ এখান থেকে সরিয়ে দিয়েছি 
    // কারণ আমরা এখন StatusBarLogic.tsx দিয়ে কন্ট্রোল করছি
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    }
  }
};

export default config;