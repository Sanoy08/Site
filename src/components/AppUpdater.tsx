// src/components/AppUpdater.tsx

'use client';

import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Rocket } from 'lucide-react';

export function AppUpdater() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState({ latestVersion: '', apkUrl: '', force: false });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const checkUpdate = async () => {
      try {
        const appInfo = await App.getInfo();
        const currentVersion = appInfo.version;

        const res = await fetch('https://www.bumbaskitchen.app/api/app-version'); // Full URL for safety
        const data = await res.json();

        if (data.success && data.latestVersion) {
          if (isNewerVersion(currentVersion, data.latestVersion)) {
            setUpdateInfo({ 
                latestVersion: data.latestVersion, 
                apkUrl: data.apkUrl,
                force: data.forceUpdate
            });
            setShowUpdate(true);
          }
        }
      } catch (error) {
        console.error("Update check failed", error);
      }
    };

    checkUpdate();
  }, []);

  const isNewerVersion = (oldVer: string, newVer: string) => {
    const oldParts = oldVer.split('.').map(Number);
    const newParts = newVer.split('.').map(Number);
    for (let i = 0; i < Math.max(oldParts.length, newParts.length); i++) {
        const o = oldParts[i] || 0;
        const n = newParts[i] || 0;
        if (n > o) return true;
        if (n < o) return false;
    }
    return false;
  };

  const handleUpdate = () => {
    if (updateInfo.apkUrl) {
        window.open(updateInfo.apkUrl, '_system');
    }
  };

  return (
    <Dialog open={showUpdate} onOpenChange={(open) => {
        // যদি ফোর্স আপডেট না হয়, তবে ডায়ালগ বন্ধ করা যাবে
        if (!updateInfo.force) setShowUpdate(open);
    }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
          if(updateInfo.force) e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Rocket className="h-6 w-6" /> Update Available!
          </DialogTitle>
          <DialogDescription className="pt-2 text-slate-600">
            A new version <strong>({updateInfo.latestVersion})</strong> is available.
            {updateInfo.force && <span className="block mt-2 text-red-500 font-bold">This update is mandatory to continue using the app.</span>}
            <br/>
            Please update now for the best experience.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center pt-2">
          <Button onClick={handleUpdate} className="w-full gap-2 text-lg h-12 shadow-lg animate-pulse">
            <Download className="h-5 w-5" /> Update Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}