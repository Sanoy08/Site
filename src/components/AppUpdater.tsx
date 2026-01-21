// src/components/AppUpdater.tsx

'use client';

import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Rocket, Loader2 } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Http } from '@capacitor-community/http'; // ★ নতুন ইমপোর্ট
import { toast } from 'sonner';

export function AppUpdater() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState({ latestVersion: '', apkUrl: '', force: false });
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const checkUpdate = async () => {
      try {
        const appInfo = await App.getInfo();
        const currentVersion = appInfo.version;

        // টাইমস্ট্যাম্প যোগ করা হয়েছে যাতে ক্যাশড ডেটা না আসে
        const res = await fetch(`https://www.bumbaskitchen.app/api/app-version?t=${new Date().getTime()}`);
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

  // ★ নতুন ডাউনলোড লজিক (Native HTTP) ★
  const handleDownloadAndInstall = async () => {
    if (!updateInfo.apkUrl) return;

    setIsDownloading(true);
    toast.info("Downloading update... Please wait.");

    try {
        const fileName = 'update.apk';

        // ১. আগে যদি কোনো ফাইল থাকে, ক্লিন করা
        try {
            await Filesystem.deleteFile({
                path: fileName,
                directory: Directory.Cache
            });
        } catch(e) { /* ফাইল না থাকলে ইগনোর করুন */ }

        // ২. Native HTTP দিয়ে ডাউনলোড করা (মেমোরি ক্রাশ হবে না)
        const response = await Http.downloadFile({
    url: updateInfo.apkUrl,
    filePath: fileName,
    // 👇 এখানে 'as any' যোগ করুন
    fileDirectory: Directory.Cache as any, 
});

        // ৩. ফাইলের সঠিক URI বের করা (FileOpener এর জন্য)
        const uriResult = await Filesystem.getUri({
            path: fileName,
            directory: Directory.Cache
        });

        // ৪. APK ওপেন/ইন্সটল করা
        await FileOpener.open({
            filePath: uriResult.uri,
            contentType: 'application/vnd.android.package-archive',
        });

        setIsDownloading(false);

    } catch (error) {
        console.error("Native Update failed:", error);
        toast.error("Download failed. Opening browser...");
        setIsDownloading(false);
        
        // ফেইল হলে ব্যাকআপ হিসেবে ব্রাউজার ওপেন হবে
        window.open(updateInfo.apkUrl, '_system');
    }
  };

  return (
    <Dialog open={showUpdate} onOpenChange={(open) => {
        if (!updateInfo.force && !isDownloading) setShowUpdate(open);
    }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
          if(updateInfo.force || isDownloading) e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Rocket className="h-6 w-6" /> Update Available!
          </DialogTitle>
          <DialogDescription className="pt-2 text-slate-600">
            Version <strong>{updateInfo.latestVersion}</strong> is ready to install.
            {updateInfo.force && <span className="block mt-2 text-red-500 font-bold">Mandatory Update.</span>}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="sm:justify-center pt-2">
          <Button 
            onClick={handleDownloadAndInstall} 
            disabled={isDownloading}
            className="w-full gap-2 text-lg h-12 shadow-lg"
          >
            {isDownloading ? (
                <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Downloading...
                </>
            ) : (
                <>
                    <Download className="h-5 w-5" /> Install Update
                </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}