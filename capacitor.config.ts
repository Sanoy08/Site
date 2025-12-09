import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bumbaskitchen.app',
  appName: "Bumba's Kitchen",
  webDir: 'public', // Next.js static output usually, but for Vercel live reload we point to URL
  server: {
    url: 'https://bumbaskitchen.app', // ★ REPLACE THIS WITH YOUR ACTUAL VERCEL URL
    cleartext: true,
    allowNavigation: [
      'your-vercel-domain.com',
      '*.bumbaskitchen.app',
      'accounts.google.com' // If you use Google Auth
    ]
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;