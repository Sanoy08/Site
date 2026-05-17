'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation'; // ★ বর্তমান পেজ ট্র্যাক করার জন্য
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export default function StatusBarLogic() {
  const pathname = usePathname(); // ইউজারের বর্তমান পেজের পাথ (যেমন: '/', '/cart', '/profile')

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const updateStatusBar = async () => {
        try {
          if (pathname === '/') {
            // ==========================================
            // ★ শুধুমাত্র হোমপেজের জন্য (Edge-to-Edge)
            // ==========================================
            await StatusBar.setOverlaysWebView({ overlay: true }); // নচের ভেতর ঢুকবে
            await StatusBar.setBackgroundColor({ color: '#00000000' }); // ট্রান্সপারেন্ট
            await StatusBar.setStyle({ style: Style.Light }); // কালো আইকন
            
          } else {
            // ==========================================
            // ★ বাকি সব পেজের জন্য (Normal White Status Bar)
            // ==========================================
            await StatusBar.setOverlaysWebView({ overlay: false }); // নচের নিচে থাকবে
            await StatusBar.setBackgroundColor({ color: '#FFFFFF' }); // সাদা ব্যাকগ্রাউন্ড
            await StatusBar.setStyle({ style: Style.Light }); // কালো আইকন
          }
        } catch (e) {
          console.error("Status bar styling failed", e);
        }
      };

      // পেজ পরিবর্তন হওয়ার সাথে সাথেই এই ফাংশনটা কল হবে
      updateStatusBar();
    }
  }, [pathname]); // ★ pathname চেঞ্জ হলেই useEffect আবার রান করবে

  return null;
}