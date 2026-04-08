// src/app/admin/settings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Store, Wallet, Save, Bell, Loader2, Smartphone, Download } from 'lucide-react';
import { toast } from 'sonner';
import { usePushNotification } from '@/hooks/use-push-notification';

export default function AdminSettingsPage() {
  const { subscribeToPush, isSubscribed, isLoading: isPushLoading } = usePushNotification();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // States
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  
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
  }, []);

  // ২. স্টোর টগল হ্যান্ডলার (ইনস্ট্যান্ট সেভ)
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

  // ৩. গ্লোবাল সেভ হ্যান্ডলার (বাকি সব সেটিং সেভ করার জন্য)
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

        {/* ★★★ NEW: App Version Control ★★★ */}
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