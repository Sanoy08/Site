import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bumbaskitchen.admin',
  appName: "Bumba's Admin",
  webDir: 'www',
  server: {
    url: 'https://admin.bumbaskitchen.app/',
    cleartext: true,
    allowNavigation: [
      "admin.bumbaskitchen.app",
      "bumbaskitchen.app",
      "*.bumbaskitchen.app",
      "accounts.google.com" // Jodi admin panele Google Login thake
    ]
  }
};

export default config;