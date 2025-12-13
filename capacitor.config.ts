import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bumbaskitchen.app',
  appName: "Bumba's Kitchen",
  webDir: 'public', // নেক্সট জেএস এর স্ট্যাটিক ফাইল ফোল্ডার
  server: {
    // ★ প্রোডাকশন সার্ভার URL (এটি ছাড়া কুকি কাজ করবে না)
    url: 'https://www.bumbaskitchen.app', 
    cleartext: true,
    // ★ Google Login এবং Firebase এর জন্য এই ডোমেইনগুলো এলাউ করতে হবে
    allowNavigation: [
      'www.bumbaskitchen.app',
      'bumbaskitchen.app',
      '*.bumbaskitchen.app',
      'accounts.google.com',      // Google Login Page
      '*.firebaseapp.com',        // Firebase Auth Domain
      '*.googleapis.com',         // Google APIs
      '*.google.com',
      '*.gstatic.com'
    ]
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    // ★ কুকি এবং নেটওয়ার্ক রিকোয়েস্ট স্ট্যাবল করার জন্য এটি অন করা হলো
    CapacitorHttp: {
      enabled: true,
    }
  }
};

export default config;