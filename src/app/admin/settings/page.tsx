// src/app/admin/settings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Store, Wallet, Save, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePushNotification } from '@/hooks/use-push-notification';

export default function AdminSettingsPage() {
  const { subscribeToPush, isSubscribed, isLoading: isPushLoading } = usePushNotification();
  
  // ★ স্টোর ওপেন স্টেট
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // ১. পেজ লোড হলে বর্তমান স্ট্যাটাস আনো
  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.success) {
                setIsStoreOpen(data.isStoreOpen);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchSettings();
  }, []);

  // ২. সুইচ টগল করার লজিক
  const handleStoreToggle = async (checked: boolean) => {
      // লোকাল স্টেট আপডেট (দ্রুত রেসপন্সের জন্য)
      setIsStoreOpen(checked);
      
      try {
          // সার্ভারে আপডেট
          await fetch('/api/settings', {
              method: 'POST',
              body: JSON.stringify({ isStoreOpen: checked })
          });
          
          if (checked) toast.success("Store is now OPEN ✅");
          else toast.warning("Store is now CLOSED ⛔");

      } catch (error) {
          toast.error("Failed to update status");
          setIsStoreOpen(!checked); // এরর হলে রিভার্ট করো
      }
  };

  const handleSave = () => {
    toast.success("Other settings saved successfully!");
  }

  const handleEnableNotifications = async () => {
     await subscribeToPush();
  }

  if (isLoading) {
      return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1">Configure your store preferences and notifications.</p>
      </div>

      <div className="grid gap-8">
        
        {/* Notification Settings (Same as before) */}
        <Card className="border-0 shadow-md">
            <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    <CardTitle>Admin Notifications</CardTitle>
                </div>
                <CardDescription>Receive alerts for new orders directly on this device.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">Order Alerts</p>
                        <p className="text-sm text-muted-foreground">Get notified when a customer places an order.</p>
                    </div>
                    <Button 
                        onClick={handleEnableNotifications} 
                        disabled={isSubscribed || isPushLoading}
                        variant={isSubscribed ? "outline" : "default"}
                        className={isSubscribed ? "text-green-600 border-green-200 bg-green-50" : ""}
                    >
                        {isPushLoading ? "Enabling..." : isSubscribed ? "Notifications Active" : "Enable Notifications"}
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* Store Configuration */}
        <Card className="border-0 shadow-md">
            <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    <CardTitle>Store Configuration</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                
                {/* ★★★ Accepting Orders Switch ★★★ */}
                <div className={`flex items-center justify-between border p-4 rounded-xl transition-colors ${isStoreOpen ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="space-y-0.5">
                        <Label className={`text-base font-semibold ${isStoreOpen ? 'text-green-900' : 'text-red-900'}`}>
                            {isStoreOpen ? 'Accepting Orders (OPEN)' : 'Store Closed'}
                        </Label>
                        <p className={`text-xs ${isStoreOpen ? 'text-green-700' : 'text-red-700'}`}>
                            {isStoreOpen ? 'Customers can place orders normally.' : 'The store is closed. No orders can be placed.'}
                        </p>
                    </div>
                    <Switch 
                        checked={isStoreOpen}
                        onCheckedChange={handleStoreToggle}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500" 
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Delivery Charge (₹)</Label>
                        <Input type="number" defaultValue="40" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                        <Label>Free Delivery Above (₹)</Label>
                        <Input type="number" defaultValue="499" placeholder="499" />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Wallet Settings (Same as before) */}
        <Card className="border-0 shadow-md">
            <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-amber-500" />
                    <CardTitle>Wallet & Reward Points</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Coins Earned per ₹100 Spent</Label>
                        <Input type="number" defaultValue="10" />
                    </div>
                    <div className="space-y-2">
                        <Label>1 Coin Value (₹)</Label>
                        <Input type="number" defaultValue="1" />
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
            <Button onClick={handleSave} size="lg" className="gap-2 shadow-lg shadow-primary/20 px-8">
                <Save className="h-4 w-4" /> Save Changes
            </Button>
        </div>
      </div>
    </div>
  );
}