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

// ★ Import DotLottie Player
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
        // ★★★ Real-time Download Logic using Fetch Stream ★★★
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
        setDownloadProgress(96); // File is converting

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

        setDownloadProgress(98); // File is saving to device

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

        setDownloadProgress(100); // Download & Save Complete!

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998]" />
      )}

      <Dialog open={showUpdate} onOpenChange={() => {}}>
        <DialogContent 
          // ★ Edge-to-edge রিমুভ করে ফ্লোটিং ডিজাইন (w-[90vw], rounded-[2.5rem]) করা হয়েছে
          className="w-[90vw] sm:max-w-sm md:max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-[2.5rem] [&>button]:hidden !z-[99999] mx-auto" 
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          
          {/* ★ লম্বা (Tall) Lottie Container */}
          <div className="relative w-full h-64 sm:h-72 bg-gradient-to-b from-primary/10 via-primary/5 to-background flex flex-col items-center justify-center pt-8">
              
              <div className="absolute top-5 left-5">
                  <Badge variant="destructive" className="bg-red-500/15 text-red-600 font-bold tracking-widest border border-red-200/50 shadow-sm px-3 py-1">
                      UPDATE REQUIRED
                  </Badge>
              </div>

              <div className="w-56 h-56 sm:w-64 sm:h-64 mt-4">
                  <DotLottiePlayer
                      src="/Update-App.lottie"
                      autoplay
                      loop
                  />
              </div>
          </div>

          <div className="p-8 pt-2 flex flex-col items-center text-center">
              <DialogHeader className="space-y-3 w-full">
                  <DialogTitle className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-black text-gray-900">
                      <Rocket className="h-7 w-7 text-primary" /> App Update
                  </DialogTitle>
                  <DialogDescription className="text-base text-gray-600 leading-relaxed px-2">
                      A fresh new version of <span className="font-semibold text-foreground">Bumba's Kitchen</span> is ready! Please update to version <strong className="text-primary text-lg">{updateInfo.latestVersion}</strong> to continue.
                  </DialogDescription>
              </DialogHeader>
              
              <DialogFooter className="sm:justify-center pt-8 flex flex-col gap-4 w-full">
                  
                  {/* ★★★ Real-time Progress Bar UI ★★★ */}
                  {isDownloading && (
                      <div className="w-full space-y-2 mb-2 animate-in fade-in zoom-in-95 duration-300">
                          <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wide px-1">
                              <span>Downloading...</span>
                              <span className="text-primary">{downloadProgress}%</span>
                          </div>
                          <div className="w-full h-3 bg-primary/10 rounded-full overflow-hidden border border-primary/20">
                              <div 
                                  className="h-full bg-primary transition-all duration-300 ease-out relative overflow-hidden" 
                                  style={{ width: `${downloadProgress}%` }} 
                              >
                                  {/* Shimmer effect inside progress bar */}
                                  <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                              </div>
                          </div>
                      </div>
                  )}

                  <Button 
                      onClick={handleDownloadAndInstall} 
                      disabled={isDownloading}
                      className="w-full gap-2 text-lg h-14 rounded-2xl shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                  >
                      {isDownloading ? (
                          <>
                              <Loader2 className="h-6 w-6 animate-spin" /> 
                              {downloadProgress === 100 ? 'Installing...' : 'Please Wait...'}
                          </>
                      ) : (
                          <>
                              <Download className="h-6 w-6 animate-bounce" /> Update Now
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

function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
            {children}
        </span>
    );
}