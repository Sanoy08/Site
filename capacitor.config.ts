// capacitor.config.ts

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
      'accounts.google.com' // Allow Google Auth pages
    ]
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    // ★ ADD THIS BLOCK ★
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // This MUST be the "Web Client ID" from Google Cloud Console
      serverClientId: '42402664604-vrqr0nssha9jqhusr7uonebt5ccrhm4j.apps.googleusercontent.com', 
      forceCodeForRefreshToken: true,
    },
  }
};

export default config;