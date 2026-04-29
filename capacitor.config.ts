// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

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
    ],
  },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
    // StatusBar কনফিগ এখান থেকে সরিয়ে দিয়েছি 
    // কারণ আমরা এখন StatusBarLogic.tsx দিয়ে কন্ট্রোল করছি
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
  }
};

export default config;