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
    // ★ ADD THIS SECTION ★
    GoogleAuth: {
      scopes: ["profile", "email"],
      // Use the "Web Client ID" from Google Cloud Console
      serverClientId: "1071253759706-k2sdmhlv0bao4osb3m6fnnsemvftigq9.apps.googleusercontent.com", 
      forceCodeForRefreshToken: true,
    },
  }
};

export default config;