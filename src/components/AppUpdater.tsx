// src/components/AppUpdater.tsx

'use client';

import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2, X } from 'lucide-react';
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
        await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache });
      } catch (e) {}

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

  // Prevent closing on backdrop click or escape if force update
  const handleOpenChange = (open: boolean) => {
    if (!open && updateInfo.force) return; // force update cannot be closed
    setShowUpdate(open);
  };

  return (
    <>
      {showUpdate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[99998] animate-in fade-in duration-200" />
      )}

      <Dialog open={showUpdate} onOpenChange={handleOpenChange}>
        <DialogContent 
          className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-3xl !z-[99999] animate-in zoom-in-95 fade-in duration-300"
          onInteractOutside={(e) => {
            if (updateInfo.force) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (updateInfo.force) e.preventDefault();
          }}
        >
          {/* Close button (only if not forced) */}
          {!updateInfo.force && (
            <button
              onClick={() => setShowUpdate(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/20 p-1.5 text-white backdrop-blur-sm transition-all hover:bg-black/40 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Animated Header with Lottie - properly dimensioned */}
          <div className="relative w-full bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 pt-8 pb-4 flex flex-col items-center justify-center">
            {/* Floating circles background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            </div>
            
            {/* Lottie Animation - perfect dimensions */}
            <div className="relative z-10 w-40 h-40 sm:w-48 sm:h-48 drop-shadow-2xl">
              <DotLottiePlayer
                src="/lottie/update-app.lottie"
                autoplay
                loop
                className="w-full h-full"
              />
            </div>

            {/* Badge */}
            <div className="relative z-10 mt-2">
              <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                New Version Available
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pt-4">
            <DialogHeader className="text-center space-y-2">
              <DialogTitle className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Update to v{updateInfo.latestVersion}
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-base">
                We've added exciting new features and improved performance.
                {updateInfo.force && (
                  <span className="block mt-1 text-red-500 font-medium">⚠️ This update is required to continue.</span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="mt-6 flex flex-col gap-3">
              {/* Progress Bar with better animation */}
              {isDownloading && (
                <div className="w-full space-y-2 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between text-xs font-semibold text-gray-500">
                    <span>Downloading update...</span>
                    <span className="text-primary">{downloadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Main Action Button */}
              <Button 
                onClick={handleDownloadAndInstall} 
                disabled={isDownloading}
                className="w-full gap-2 text-base sm:text-lg h-12 sm:h-14 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> 
                    {downloadProgress === 100 ? 'Installing...' : `Downloading ${downloadProgress}%`}
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" /> Update Now
                  </>
                )}
              </Button>

              {/* Optional secondary message */}
              {!updateInfo.force && !isDownloading && (
                <p className="text-center text-xs text-gray-400">
                  Update takes about 30 seconds. Your data is safe.
                </p>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}