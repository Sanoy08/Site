// src/components/DeviceEnforcer.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export default function DeviceEnforcer() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Jodi already /web page-e thake tahole check korar dorkar nei (nahole infinite loop hobe)
        if (pathname?.startsWith('/web')) return;

        // Mobile device kina check korche (User Agent diye)
        const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Native App (Capacitor) kina check korche
        const isNativeApp = Capacitor.isNativePlatform();

        // LOGIC: Jodi Mobile hoy AND Native App NA hoy, tahole forced redirect
        if (isMobileBrowser && !isNativeApp) {
            router.replace('/web');
        }
    }, [pathname, router]);

    return null; // Ei component kono UI dekhabe na, shudhu background e kaj korbe
}