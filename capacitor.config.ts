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
    // @ts-ignore
    adjustMarginsForEdgeToEdge: 'disable',
    zoomEnabled: false,
    backgroundColor: "#F8F9FA"
  },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: false, // ★ false করা হলো যাতে লাফিয়ে না ওঠে
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
    SplashScreen: {
      launchShowDuration: 0, // ★ 0 করা হলো
      launchAutoHide: true,
      backgroundColor: "#F8F9FA",
      showSpinner: false
    }
  }
};

export default config;