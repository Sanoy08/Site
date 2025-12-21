import type { CapacitorConfig } from '@capacitor/cli';

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
    ]
  },
  android: {
    // @ts-ignore
    adjustMarginsForEdgeToEdge: 'disable',
    zoomEnabled: false,
    // সাদা ফ্ল্যাশ আটকানোর জন্য ব্যাকগ্রাউন্ড কালার সবুজে সেট করুন
    backgroundColor: "#7D9A4D" 
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK' 
    },
    // ★ এই অংশটি অবশ্যই যোগ করতে হবে ★
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false, // অটোমেটিক বন্ধ হবে না, আমরা কোড দিয়ে বন্ধ করব
      backgroundColor: "#7D9A4D", // আপনার স্প্ল্যাশ স্ক্রিনের ব্যাকগ্রাউন্ড কালার
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    }
  }
};

export default config;