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
    
    // ★ ADD THIS LINE (Disables WebView Zooming) ★
    zoomEnabled: false
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
    }
  }
};

export default config;