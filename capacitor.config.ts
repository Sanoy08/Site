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
      'accounts.google.com' // Allow Google Auth navigation
    ]
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    // [ADD THIS SECTION]
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // IMPORTANT: Use your "Web Client ID" here, not Android/iOS ID
      serverClientId: process.env.GOOGLE_CLIENT_ID || '1071253759706-k2sdmhlv0bao4osb3m6fnnsemvftigq9.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;