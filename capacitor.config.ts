import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { Style } from '@capacitor/status-bar'; // ★ ইম্পোর্ট করতে হবে

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
    // errorPath: 'offline.html',
  },
  android: {
    // @ts-ignore
    adjustMarginsForEdgeToEdge: 'disable',
    zoomEnabled: false,
    // ★ অ্যাপ ওপেন হওয়ার সময় ব্যাকগ্রাউন্ড কালার (সাদা করে দেওয়া হলো)
    backgroundColor: "#FFFFFF" 
  },
  plugins: {
    // ★★★ 1. KEYBOARD SETTINGS (To fix input hiding) ★★★
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
    
    // ★★★ 2. STATUS BAR SETTINGS (Colour Change) ★★★
    StatusBar: {
      overlaysWebView: false,
      
      // ★ style: 'LIGHT' মানে আইকনগুলো কালো (Dark) হবে (সাদা ব্যাকগ্রাউন্ডের জন্য)
      // ★ style: 'DARK' মানে আইকনগুলো সাদা (White) হবে (ডার্ক ব্যাকগ্রাউন্ডের জন্য)
      // @ts-ignore
      style: 'LIGHT', 
      
      // ★ স্ট্যাটাস বারের ব্যাকগ্রাউন্ড কালার (এখানে সাদা দেওয়া হলো)
      backgroundColor: '#FFFFFF', 
    },

    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
    SplashScreen: {
      launchShowDuration: 2000, // একটু বাড়িয়ে দেওয়া হলো যাতে লোডিং স্মুথ লাগে
      launchAutoHide: true,
      backgroundColor: "#FFFFFF", // স্প্ল্যাশ স্ক্রিনের ব্যাকগ্রাউন্ডও সাদা
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    }
  }
};

export default config;