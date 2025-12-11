import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bumbaskitchen.app',
  appName: "Bumba's Kitchen",
  webDir: 'public',
  server: {
    url: 'https://www.bumbaskitchen.app', // আপনার লাইভ URL
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
    // ★ ফিক্স: কিবোর্ড ওপেন হলেও স্ট্যাটাস বার ট্রান্সপারেন্ট থাকবে
    Keyboard: {
      resize: 'body', // বডি রিসাইজ হবে, কিন্তু ভিউপোর্ট নয়
      style: 'dark',
      resizeOnFullScreen: true, // ★ এটিই মূল সমাধান (Android এর জন্য)
    },
  }
};

export default config;