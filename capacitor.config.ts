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
      '*.bumbaskitchen.app',
      'accounts.google.com'
    ]
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    // ★ ADD THIS SECTION ★
    GoogleAuth: {
      scopes: ["profile", "email"],
      // Use the "Web Client ID" from Google Cloud Console
      serverClientId: "42402664604-s7ekkg9btmp5bqq6cs9k5h7283a12mlf.apps.googleusercontent.com", 
      forceCodeForRefreshToken: true,
    },
  }
};

export default config;