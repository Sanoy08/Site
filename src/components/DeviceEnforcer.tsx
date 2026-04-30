// src/components/DeviceEnforcer.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export default function DeviceEnforcer() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // 1. Jodi already /web page-e thake tahole kichu korar dorkar nei
        if (pathname?.startsWith('/web')) return;

        // 2. EXCEPTIONS: Jodi link-e '.apk' thake tahole redirect bondho thakbe
        // Jate download link ta thikmoto kaj kore
        if (pathname?.endsWith('.apk')) return;

        const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isNativeApp = Capacitor.isNativePlatform();

        // 3. Logic: Mobile browser kintu Native App noy, tahole redirect
        if (isMobileBrowser && !isNativeApp) {
            router.replace('/web');
        }
    }, [pathname, router]);

    return null;
}