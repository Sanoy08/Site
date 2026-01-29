'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export default function StatusBarLogic() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const setStatus = async () => {
        try {
          // ১. স্ট্যাটাস বারের ব্যাকগ্রাউন্ড সাদা করা
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
          
          // ২. আইকন এবং টেক্সট কালো করা (Style.Light মানে ব্যাকগ্রাউন্ড লাইট, টেক্সট ডার্ক)
          await StatusBar.setStyle({ style: Style.Light });
          
          // ৩. অ্যান্ড্রয়েডে ওভারলে বন্ধ রাখা
          await StatusBar.setOverlaysWebView({ overlay: false });
        } catch (e) {
          console.error("Status bar error", e);
        }
      };
      
      // অ্যাপ লোড হওয়ার সাথে সাথে কল হবে
      setStatus();
    }
  }, []);

  return null; // এটি কোনো UI রেন্ডার করবে না
}