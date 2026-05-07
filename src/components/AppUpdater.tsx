// src/components/AppUpdater.tsx

'use client';

import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { toast } from 'sonner';
import { DotLottiePlayer } from '@dotlottie/react-player';

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
    setDownloadProgress(0); 
    toast.info("Starting download...");

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
    <>
      {showUpdate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[99998]" />
      )}

      <Dialog open={showUpdate} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md p-6 overflow-visible border-0 shadow-2xl rounded-3xl [&>button]:hidden !z-[99999]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {/* Lottie Animation Header - White background, not edge-to-edge */}
          <div className="relative flex flex-col items-center justify-center pb-4">
            <div className="w-48 h-48 -mt-8">
              <DotLottiePlayer
                src="/update-app.lottie"   // Path without "lottie/" folder
                autoplay
                loop
              />
            </div>
            <div className="mt-2">
              <span className="bg-red-600 text-white font-bold tracking-widest rounded-full px-3 py-1 text-xs uppercase shadow-sm">
                Update Required
              </span>
            </div>
          </div>

          <div className="flex flex-col space-y-5">
            <DialogHeader className="text-center space-y-2">
              <DialogTitle className="flex items-center justify-center gap-2 text-2xl font-black text-gray-900">
                <Download className="h-6 w-6 text-primary" /> App Update
              </DialogTitle>
              <DialogDescription className="text-base text-gray-600 text-center">
                Please update to version <strong className="text-primary">{updateInfo.latestVersion}</strong> to continue using Bumba's Kitchen.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="flex flex-col gap-3 w-full pt-2">
              
              {isDownloading && (
                <div className="w-full space-y-2 mb-2 animate-in fade-in">
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wide">
                    <span>Downloading...</span>
                    <span>{downloadProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border">
                    <div 
                      className="h-full bg-primary transition-all duration-300 ease-out rounded-full" 
                      style={{ width: `${downloadProgress}%` }} 
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={handleDownloadAndInstall} 
                disabled={isDownloading}
                className="w-full gap-2 text-lg h-14 rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" /> 
                    {downloadProgress === 100 ? 'Installing...' : 'Please Wait...'}
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
    </>
  );
}