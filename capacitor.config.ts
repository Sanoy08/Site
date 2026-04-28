import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bumbaskitchen.app',
  appName: "Bumba's Kitchen",
  webDir: 'public',
  server: {
    url: 'https://www.bumbaskitchen.app',
    cleartext: true,
    androidScheme: 'https', // এটি যোগ করুন, এটি ব্রিজ কানেকশনে সাহায্য করে
    allowNavigation: [
      'bumbaskitchen.app',
      'www.bumbaskitchen.app',
      'admin.bumbaskitchen.app',
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
      // সরাসরি এনাম (KeyboardResize.Body) ব্যবহার না করে স্ট্রিং ব্যবহার করুন
      resize: 'body', 
      style: 'dark',
      resizeOnFullScreen: true,
    },
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