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
        } catch (e) { }

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
    <Dialog open={showUpdate} onOpenChange={() => {}}>
      <DialogContent 
        // ★ [&>button]:hidden যোগ করা হয়েছে যাতে ডিফল্ট ক্রস(X) বাটনটি হাইড হয়ে যায়
        className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-2xl [&>button]:hidden" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        
        <div className="relative w-full h-48 bg-muted">
            <img 
                src="https://res.cloudinary.com/dhhfisazd/image/upload/v1774462065/unnamed_wdwhvd.jpg" 
                alt="App Update Required"
                className="w-full h-full object-cover"
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.classList.add('bg-gradient-to-r', 'from-orange-400', 'to-red-500');
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <Badge variant="destructive" className="bg-red-600 text-white font-bold tracking-widest border-0">
                    UPDATE REQUIRED
                </Badge>
            </div>
        </div>

        <div className="p-6">
            <DialogHeader className="text-left space-y-1.5">
                <DialogTitle className="flex items-center gap-2 text-2xl font-black text-gray-900">
                    <Rocket className="h-6 w-6 text-primary" /> App Update
                </DialogTitle>
                {/* ★ লেখা অনেক কমিয়ে দেওয়া হয়েছে */}
                <DialogDescription className="text-base text-gray-600">
                    Please update to version <strong className="text-primary">{updateInfo.latestVersion}</strong> to continue using Bumba's Kitchen.
                </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="sm:justify-center pt-5">
                <Button 
                    onClick={handleDownloadAndInstall} 
                    disabled={isDownloading}
                    className="w-full gap-2 text-lg h-14 rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
                >
                    {isDownloading ? (
                        <>
                            <Loader2 className="h-6 w-6 animate-spin" /> 
                            {downloadProgress > 0 ? `Downloading ${downloadProgress}%` : 'Starting...'}
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

function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
            {children}
        </span>
    );
}