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
    // ★★★ এই অংশটি মিসিং ছিল, যার কারণে ক্র্যাশ করছে ★★★
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
  }
};

export default config;