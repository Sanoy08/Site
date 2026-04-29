import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bumbaskitchen.admin',
  appName: "Bumba's Admin",
  webDir: 'www',
  server: {
    url: 'https://admin.bumbaskitchen.app/',
    cleartext: true
  }
};

export default config;