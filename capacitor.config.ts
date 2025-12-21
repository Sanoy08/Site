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
    // ব্যাকগ্রাউন্ড কালার সাদা বা সবুজ দিন যাতে কালো স্ক্রিন না আসে
    backgroundColor: "#ffffff" 
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
    // ★ এই অংশটি নতুন যোগ করুন (ব্ল্যাক স্ক্রিন ফিক্স) ★
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 200,
      backgroundColor: "#ffffff", // অথবা আপনার সবুজ কালার "#7D9A4D"
      androidSplashResourceName: "splash",
      showSpinner: false, // লোডিং স্পিনার বন্ধ রাখতে চাইলে false দিন
      splashFullScreen: true,
      splashImmersive: true,
    }
  }
};

export default config;