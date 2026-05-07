// src/components/AppUpdater.tsx

'use client';

import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Import DotLottie Player
import { DotLottiePlayer } from '@dotlottie/react-player';

export function AppUpdater() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState({ latestVersion: '', apkUrl: '', force: false });
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // ★ Background scroll bondho korar logic
  useEffect(() => {
    if (showUpdate) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showUpdate]);

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
    setDownloadProgress(0); 

    try {
        const response = await fetch(updateInfo.apkUrl, {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const reader = response.body?.getReader();
        const chunks = [];

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                chunks.push(value);
                loaded += value.byteLength;

                if (total) {
                    const percent = Math.round((loaded / total) * 100);
                    setDownloadProgress(Math.min(percent, 95));
                }
            }
        }

        const blob = new Blob(chunks);
        setDownloadProgress(96);

        const base64Data = await new Promise<string>((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onloadend = () => {
                const base64 = fileReader.result as string;
                const base64Raw = base64.split(',')[1]; 
                resolve(base64Raw);
            };
            fileReader.onerror = reject;
            fileReader.readAsDataURL(blob);
        });

        setDownloadProgress(98); 

        const fileName = 'update.apk';

        try {
            await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache });
        } catch (e) { }

        await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
        });

        setDownloadProgress(100); 

        const uriResult = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });

        await FileOpener.open({
            filePath: uriResult.uri,
            contentType: 'application/vnd.android.package-archive',
        });

        setIsDownloading(false);

    } catch (error: any) {
        toast.error('Update failed. Please try again.');
        setIsDownloading(false);
    }
  };

  return (
    <div 
        className={cn(
            "fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300",
            showUpdate ? "visible opacity-100 pointer-events-auto" : "invisible opacity-0 pointer-events-none"
        )}
    >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Custom Minimal Modal */}
        <div 
            className={cn(
                "relative w-[85vw] max-w-[340px] bg-background p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center gap-5 transition-transform duration-300",
                showUpdate ? "scale-100 translate-y-0" : "scale-95 translate-y-8"
            )}
        >
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mt-2">
                Action Required
            </span>

            <div className="w-52 h-52 sm:w-56 sm:h-56 -my-4 relative flex items-center justify-center">
                <DotLottiePlayer
                    src="/Update-App.lottie"
                    autoplay
                    loop
                    className="w-full h-full"
                />
            </div>

            <div className="space-y-1.5 w-full">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    New Update
                </h2>
                <p className="text-sm text-muted-foreground">
                    Version {updateInfo.latestVersion || '...'} is required to continue.
                </p>
            </div>
            
            <div className="w-full mt-2">
                {isDownloading ? (
                    <div className="w-full space-y-2 animate-in fade-in duration-300">
                        <div className="flex justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                            <span>Downloading</span>
                            <span className="text-primary">{downloadProgress}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-primary/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-300 ease-out" 
                                style={{ width: `${downloadProgress}%` }} 
                            />
                        </div>
                    </div>
                ) : (
                    <Button 
                        onClick={handleDownloadAndInstall} 
                        className="w-full text-base font-semibold h-12 rounded-2xl shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                    >
                        Update Now
                    </Button>
                )}
            </div>
        </div>
    </div>
  );
}