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
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    // ★ আপডেট: Firebase Authentication প্লাগিন কনফিগ
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
    // ★ NEW: Global Status Bar Fix
    StatusBar: {
      overlaysWebView: true,       // Required to calculate safe area
      style: 'DARK',               // Makes time/battery icons white (use 'LIGHT' for black icons)
      backgroundColor: '#7D9A4D',  // Matches your splash screen green
    },
  }
};

export default config;