// src/components/AppUpdater.tsx

'use client';

import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Rocket, Loader2, RefreshCw } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { toast } from 'sonner';

export function AppUpdater() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState({ latestVersion: '', apkUrl: '', force: false });
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const checkUpdate = async () => {
      try {
        const appInfo = await App.getInfo();
        const currentVersion = appInfo.version;

        // টাইমস্ট্যাম্প দিয়ে ক্যাশ বাইপাস করা হচ্ছে
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

  const handleDownloadAndInstall = async () => {
    if (!updateInfo.apkUrl) return;

    setIsDownloading(true);
    setDownloadProgress(10); // শুরু বোঝানোর জন্য
    toast.info("Starting download...");

    try {
        // ১. ফাইল ডাউনলোড (Fetch API)
        // নোট: বড় ফাইলের জন্য এটি মেমোরি নিতে পারে, তবে ২০-৩০ MB পর্যন্ত সমস্যা নেই
        const response = await fetch(updateInfo.apkUrl, {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (!response.ok) throw new Error("Network response was not ok");

        setDownloadProgress(50); // ডাউনলোড অর্ধেক হয়েছে
        const blob = await response.blob();

        // ২. Blob কে Base64 এ কনভার্ট করা (Filesystem এ সেভ করার জন্য)
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // 'data:application/vnd.android.package-archive;base64,' অংশটি বাদ দিতে হবে
                const base64Raw = base64.split(',')[1]; 
                resolve(base64Raw);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        setDownloadProgress(80); // কনভার্সন শেষ

        const fileName = 'update.apk';

        // ৩. আগের ফাইল ডিলিট করা (যদি থাকে)
        try {
            await Filesystem.deleteFile({
                path: fileName,
                directory: Directory.Cache
            });
        } catch (e) { /* ফাইল না থাকলে ইগনোর */ }

        // ৪. ফাইল সেভ করা
        const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
        });

        setDownloadProgress(100); // সেভ শেষ

        // ৫. ফাইলের URI বের করা
        const uriResult = await Filesystem.getUri({
            path: fileName,
            directory: Directory.Cache
        });

        // ৬. অ্যাপ ইন্সটল করা
        await FileOpener.open({
            filePath: uriResult.uri,
            contentType: 'application/vnd.android.package-archive',
        });

        setIsDownloading(false);

    } catch (error: any) {
        console.error("In-App Update Failed:", error);
        // এরর মেসেজটি ইউজারের কাছে দেখানো হচ্ছে যাতে বোঝা যায় কেন ফেইল হলো
        toast.error(`Update failed: ${error.message || 'Unknown error'}`);
        
        // ফেইল হলে ব্রাউজারে খোলার অপশন
        setTimeout(() => {
            if(confirm("In-app update failed. Open in browser instead?")) {
                window.open(updateInfo.apkUrl, '_system');
            }
        }, 1000);
        
        setIsDownloading(false);
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
            Version <strong>{updateInfo.latestVersion}</strong> is ready.
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
                    <Loader2 className="h-5 w-5 animate-spin" /> 
                    {downloadProgress > 0 ? `Downloading ${downloadProgress}%` : 'Downloading...'}
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