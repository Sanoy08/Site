// src/components/AppUpdater.tsx

'use client';

import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Rocket, Loader2, AlertCircle } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { toast } from 'sonner';
import Image from 'next/image';

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

        // টাইমস্ট্যাম্প দিয়ে ক্যাশ বাইপাস করা হচ্ছে
        const res = await fetch(`https://www.bumbaskitchen.app/api/app-version?t=${new Date().getTime()}`);
        const data = await res.json();

        if (data.success && data.latestVersion) {
          if (isNewerVersion(currentVersion, data.latestVersion)) {
            setUpdateInfo({ 
                latestVersion: data.latestVersion, 
                apkUrl: data.apkUrl,
                force: data.forceUpdate // ডাটাবেস থেকে আসছে, কিন্তু আমরা UI তে সবসময় ফোর্স করব
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
    setDownloadProgress(10); 
    toast.info("Starting download...");

    try {
        const response = await fetch(updateInfo.apkUrl, {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (!response.ok) throw new Error("Network response was not ok");

        setDownloadProgress(50); 
        const blob = await response.blob();

        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                const base64Raw = base64.split(',')[1]; 
                resolve(base64Raw);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        setDownloadProgress(80); 

        const fileName = 'update.apk';

        try {
            await Filesystem.deleteFile({
                path: fileName,
                directory: Directory.Cache
            });
        } catch (e) { /* ফাইল না থাকলে ইগনোর */ }

        await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
        });

        setDownloadProgress(100); 

        const uriResult = await Filesystem.getUri({
            path: fileName,
            directory: Directory.Cache
        });

        await FileOpener.open({
            filePath: uriResult.uri,
            contentType: 'application/vnd.android.package-archive',
        });

        setIsDownloading(false);

    } catch (error: any) {
        console.error("In-App Update Failed:", error);
        toast.error(`Update failed: ${error.message || 'Unknown error'}`);
        
        setTimeout(() => {
            if(confirm("In-app update failed. Open in browser instead?")) {
                window.open(updateInfo.apkUrl, '_system');
            }
        }, 1000);
        
        setIsDownloading(false);
    }
  };

  return (
    <Dialog 
        open={showUpdate} 
        // ★ ইউজার যাতে কোনোভাবেই পপআপ কাটতে না পারে তার জন্য এটি ফাঁকা রাখা হলো
        onOpenChange={() => {}} 
    >
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-2xl" 
        // ★ বাইরে ক্লিক বা 'Esc' বাটন প্রেস করলেও পপআপ বন্ধ হবে না
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        
        {/* ★★★ Image Section ★★★ */}
        <div className="relative w-full h-48 bg-muted">
            {/* সতর্কতা: নিচের লিংকের জায়গায় Cloudinary-এর ডিরেক্ট ইমেজ লিংক দিতে হবে */}
            <img 
                src="https://res.cloudinary.com/dhhfisazd/image/upload/v1774462065/unnamed_wdwhvd.jpg" 
                alt="App Update Required"
                className="w-full h-full object-cover"
                onError={(e) => {
                    // ইমেজ লোড না হলে একটি ডিফল্ট গ্রেডিয়েন্ট ব্যাকগ্রাউন্ড দেখাবে
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.classList.add('bg-gradient-to-r', 'from-orange-400', 'to-red-500');
                }}
            />
            {/* ইমেজের ওপর শ্যাডো ইফেক্ট */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <Badge variant="destructive" className="bg-red-600 text-white font-bold tracking-widest border-0">
                    MANDATORY UPDATE
                </Badge>
            </div>
        </div>

        <div className="p-6">
            <DialogHeader className="text-left space-y-2">
                <DialogTitle className="flex items-center gap-2 text-2xl font-black text-gray-900">
                    <Rocket className="h-6 w-6 text-primary" /> Time to Update!
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600">
                    We've added new features and fixed some bugs to make your experience smoother. 
                    <span className="block mt-2 font-medium text-gray-800">
                        Version <strong className="text-primary">{updateInfo.latestVersion}</strong> is required to continue using Bumba's Kitchen.
                    </span>
                </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="sm:justify-center pt-6">
                <Button 
                    onClick={handleDownloadAndInstall} 
                    disabled={isDownloading}
                    className="w-full gap-2 text-lg h-14 rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
                >
                    {isDownloading ? (
                        <>
                            <Loader2 className="h-6 w-6 animate-spin" /> 
                            {downloadProgress > 0 ? `Downloading ${downloadProgress}%` : 'Starting Download...'}
                        </>
                    ) : (
                        <>
                            <Download className="h-6 w-6" /> Update Now
                        </>
                    )}
                </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Badge component inline for convenience if it's not imported correctly above
function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
            {children}
        </span>
    );
}