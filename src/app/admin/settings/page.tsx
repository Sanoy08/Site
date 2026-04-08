// src/app/admin/settings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Store, Wallet, Save, Bell, Loader2, Smartphone, Download, User } from 'lucide-react';
import { toast } from 'sonner';
import { usePushNotification } from '@/hooks/use-push-notification';

// ★ Capacitor Preferences Import
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export default function AdminSettingsPage() {
  const { subscribeToPush, isSubscribed, isLoading: isPushLoading } = usePushNotification();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // States
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // App Version Config
  const [appConfig, setAppConfig] = useState({
      androidVersion: '1.0.0',
      apkUrl: '',
      forceUpdate: false
  });

  // Wallet & Delivery Config
  const [storeConfig, setStoreConfig] = useState({
      deliveryCharge: '40',
      freeDeliveryAbove: '499',
      coinsPer100: '10',
      coinValue: '1'
  });

  // ১. ডেটা ফেচ করা
  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.success) {
                setIsStoreOpen(data.isStoreOpen);
                setAppConfig({
                    androidVersion: data.androidVersion || '1.0.0',
                    apkUrl: data.apkUrl || '',
                    forceUpdate: data.forceUpdate || false
                });
                setStoreConfig({
                    deliveryCharge: data.deliveryCharge?.toString() || '40',
                    freeDeliveryAbove: data.freeDeliveryAbove?.toString() || '499',
                    coinsPer100: data.coinsPer100?.toString() || '10',
                    coinValue: data.coinValue?.toString() || '1'
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchSettings();

    // ★ চেক করা হচ্ছে নেটিভ অ্যাপ কি না এবং অ্যাডমিন মোড স্ট্যাটাস
    if (Capacitor.isNativePlatform()) {
        setIsNativeApp(true);
        const checkAppMode = async () => {
            const { value } = await Preferences.get({ key: 'app_mode' });
            setIsAdminMode(value === 'admin');
        };
        checkAppMode();
    }
  }, []);

  // ২. স্টোর টগল হ্যান্ডলার
  const handleStoreToggle = async (checked: boolean) => {
      setIsStoreOpen(checked);
      try {
          await fetch('/api/settings', {
              method: 'POST',
              body: JSON.stringify({ isStoreOpen: checked })
          });
          if (checked) toast.success("Store OPENED ✅");
          else toast.warning("Store CLOSED ⛔");
      } catch (error) {
          toast.error("Failed to update status");
          setIsStoreOpen(!checked);
      }
  };

  // ★ ৩. অ্যাডমিন মোড অফ করার হ্যান্ডলার
  const handleAdminModeToggle = async (checked: boolean) => {
      setIsAdminMode(checked);
      const mode = checked ? 'admin' : 'user';
      await Preferences.set({ key: 'app_mode', value: mode });
      
      if (!checked) {
          toast.success("Admin mode disabled! Redirecting to shop...");
          setTimeout(() => {
              // replace এবং www ব্যবহার করা হয়েছে যাতে আটকে না যায়
              window.location.replace('https://www.bumbaskitchen.app/');
          }, 1000);
      } else {
          toast.success("Admin mode enabled. App will launch here next time.");
      }
  };

  // ★ ৪. সরাসরি শপে ফিরে যাওয়ার বাটন হ্যান্ডলার
  const handleReturnToShop = async () => {
      await Preferences.set({ key: 'app_mode', value: 'user' });
      window.location.replace('https://www.bumbaskitchen.app/');
  };

  // ৫. গ্লোবাল সেভ হ্যান্ডলার
  const handleSave = async () => {
    setIsSaving(true);
    try {
        const payload = {
            androidVersion: appConfig.androidVersion,
            apkUrl: appConfig.apkUrl,
            forceUpdate: appConfig.forceUpdate,
            deliveryCharge: parseFloat(storeConfig.deliveryCharge),
            freeDeliveryAbove: parseFloat(storeConfig.freeDeliveryAbove),
            coinsPer100: parseFloat(storeConfig.coinsPer100),
            coinValue: parseFloat(storeConfig.coinValue)
        };

        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) toast.success("All settings saved successfully! 🎉");
        else throw new Error("Failed");
    } catch (e) {
        toast.error("Error saving settings");
    } finally {
        setIsSaving(false);
    }
  }

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1">Configure your store, app updates and notifications.</p>
      </div>

      <div className="grid gap-8">
        
        {/* Store Open/Close */}
        <Card className="border-0 shadow-md">
            <CardHeader className="bg-muted/30 border-b py-4">
                <div className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" /><CardTitle>Store Status</CardTitle></div>
            </CardHeader>
            <CardContent className="p-6">
                <div className={`flex items-center justify-between border p-4 rounded-xl transition-colors ${isStoreOpen ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="space-y-0.5">
                        <Label className={`text-base font-semibold ${isStoreOpen ? 'text-green-900' : 'text-red-900'}`}>
                            {isStoreOpen ? 'Store is OPEN' : 'Store is CLOSED'}
                        </Label>
                        <p className="text-xs text-muted-foreground">Toggle to open or close orders.</p>
                    </div>
                    <Switch checked={isStoreOpen} onCheckedChange={handleStoreToggle} className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500" />
                </div>
            </CardContent>
        </Card>

        {/* ★★★ NEW: App Mode Toggle & Return Button ★★★ */}
        {isNativeApp && (
            <Card className="border-0 shadow-md ring-1 ring-purple-100">
                <CardHeader className="bg-purple-50/50 border-b py-4">
                    <div className="flex items-center gap-2 text-purple-700">
                        <User className="h-5 w-5" />
                        <CardTitle>App View Mode</CardTitle>
                    </div>
                    <CardDescription>Control how the app launches on this device.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    
                    <div className="flex items-center justify-between border p-4 rounded-xl bg-background shadow-sm">
                        <div className="space-y-0.5 pr-4">
                            <Label className="text-base font-semibold">
                                Launch as Admin Default
                            </Label>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Turn this ON to always open the Admin Panel when launching the app.
                            </p>
                        </div>
                        <Switch 
                            checked={isAdminMode} 
                            onCheckedChange={handleAdminModeToggle} 
                            className="data-[state=checked]:bg-purple-600 scale-110" 
                        />
                    </div>

                    {/* ★ সরাসরি শপে যাওয়ার বাটন ★ */}
                    <Button 
                        onClick={handleReturnToShop}
                        variant="outline"
                        className="w-full h-12 text-base font-bold gap-2 text-purple-700 border-purple-200 hover:bg-purple-50 shadow-sm"
                    >
                        <Store className="h-5 w-5" /> Exit Admin & Go to Shop
                    </Button>

                </CardContent>
            </Card>
        )}

        {/* App Version Control */}
        <Card className="border-0 shadow-md ring-1 ring-blue-100">
            <CardHeader className="bg-blue-50/50 border-b py-4">
                <div className="flex items-center gap-2 text-blue-700">
                    <Smartphone className="h-5 w-5" />
                    <CardTitle>App Version Control</CardTitle>
                </div>
                <CardDescription>Manage Android APK updates for users.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Latest Version (e.g. 1.0.2)</Label>
                        <Input 
                            value={appConfig.androidVersion} 
                            onChange={(e) => setAppConfig({...appConfig, androidVersion: e.target.value})} 
                            placeholder="1.0.0" 
                            className="font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Direct APK Link</Label>
                        <Input 
                            value={appConfig.apkUrl} 
                            onChange={(e) => setAppConfig({...appConfig, apkUrl: e.target.value})} 
                            placeholder="https://.../app-release.apk" 
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between border p-3 rounded-lg bg-gray-50">
                    <div className="space-y-0.5">
                        <Label>Force Update?</Label>
                        <p className="text-xs text-muted-foreground">User MUST update to continue using the app.</p>
                    </div>
                    <Switch 
                        checked={appConfig.forceUpdate} 
                        onCheckedChange={(c) => setAppConfig({...appConfig, forceUpdate: c})} 
                    />
                </div>
            </CardContent>
        </Card>

        {/* Wallet & Delivery Settings */}
        <Card className="border-0 shadow-md">
            <CardHeader className="bg-muted/30 border-b py-4">
                <div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-amber-500" /><CardTitle>General Config</CardTitle></div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Delivery Charge (₹)</Label>
                        <Input type="number" value={storeConfig.deliveryCharge} onChange={(e) => setStoreConfig({...storeConfig, deliveryCharge: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Free Delivery Above (₹)</Label>
                        <Input type="number" value={storeConfig.freeDeliveryAbove} onChange={(e) => setStoreConfig({...storeConfig, freeDeliveryAbove: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Coins per ₹100 Spent</Label>
                        <Input type="number" value={storeConfig.coinsPer100} onChange={(e) => setStoreConfig({...storeConfig, coinsPer100: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>1 Coin Value (₹)</Label>
                        <Input type="number" value={storeConfig.coinValue} onChange={(e) => setStoreConfig({...storeConfig, coinValue: e.target.value})} />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Admin Notifications */}
        <Card className="border-0 shadow-md">
            <CardHeader className="bg-muted/30 border-b py-4">
                <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-purple-500" /><CardTitle>This Device</CardTitle></div>
            </CardHeader>
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive alerts on this device.</p>
                </div>
                <Button 
                    onClick={subscribeToPush} 
                    disabled={isSubscribed || isPushLoading}
                    variant={isSubscribed ? "outline" : "default"}
                    className={isSubscribed ? "text-green-600 border-green-200 bg-green-50" : ""}
                >
                    {isPushLoading ? "Enabling..." : isSubscribed ? "Active ✅" : "Enable"}
                </Button>
            </CardContent>
        </Card>

        {/* SAVE BUTTON */}
        <div className="sticky bottom-4 flex justify-end">
            <Button onClick={handleSave} size="lg" className="gap-2 shadow-xl bg-primary hover:bg-primary/90 px-8 h-12 text-lg rounded-full" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : <Save className="h-5 w-5" />} Save Changes
            </Button>
        </div>
      </div>
    </div>
  );
}