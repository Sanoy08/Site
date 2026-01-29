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
    // errorPath: 'offline.html',
  },
  android: {
    // @ts-ignore
    adjustMarginsForEdgeToEdge: 'disable',
    zoomEnabled: false,
    backgroundColor: "#ffffff" 
  },
  plugins: {
    // ★★★ KEYBOARD SETTINGS (New) ★★★
    Keyboard: {
      resize: KeyboardResize.Body, // বা শুধু 'body'
      style: KeyboardStyle.Dark,   // বা শুধু 'DARK'
      resizeOnFullScreen: true,
    },
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