import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bumbaskitchen.app',
  appName: "Bumba's Kitchen",
  webDir: 'public',
  server: {
    url: 'https://bumbaskitchen.app', // ★ EKHANE TOMAR LIVE URL DAO
    cleartext: true,
    allowNavigation: [
      'your-vercel-domain.com',
      '*.bumbaskitchen.app'
    ]
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;