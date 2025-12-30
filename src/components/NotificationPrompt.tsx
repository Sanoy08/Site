'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';

export default function NotificationPrompt() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user) return;
      
      const hasRejected = localStorage.getItem('notification-rejected');
      if (hasRejected) return;

      let status = '';

      if (Capacitor.isNativePlatform()) {
        const permStatus = await PushNotifications.checkPermissions();
        status = permStatus.receive;
      } else {
        if (!('Notification' in window)) return;
        status = Notification.permission;
      }

      // ★★★ UPDATED: 5 Seconds Delay ★★★
      if (status !== 'granted') {
        setTimeout(() => setIsOpen(true), 5000);
      }
    };

    checkPermission();
  }, [user]);

  const handleAllow = async () => {
    try {
      let permissionGranted = false;

      if (Capacitor.isNativePlatform()) {
        const result = await PushNotifications.requestPermissions();
        if (result.receive === 'granted') {
          await PushNotifications.register();
          permissionGranted = true;
        }
      } else {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          permissionGranted = true;
        }
      }

      if (permissionGranted) {
        toast.success("Notifications enabled!", {
          icon: <CheckCircle className="text-green-600 h-5 w-5" />
        });
        setIsOpen(false);
      } else {
        toast.error("Permission denied via settings.");
        setIsOpen(false);
      }

    } catch (error) {
      console.error("Error requesting permission:", error);
      setIsOpen(false);
    }
  };

  const handleReject = () => {
    localStorage.setItem('notification-rejected', 'true');
    setIsOpen(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          {/* Header Compact */}
          <DrawerHeader className="flex flex-col items-center text-center pt-6 pb-2">
            
            {/* Small Icon */}
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 ring-4 ring-primary/5">
              <Bell className="h-6 w-6 text-primary animate-bounce" />
            </div>

            <DrawerTitle className="text-lg font-bold">
              Allow Notifications?
            </DrawerTitle>
            <DrawerDescription className="text-center text-muted-foreground mt-1 text-sm px-4 leading-tight">
              Get updates on your <b>Order Status</b> & <b>Discounts</b> directly.
            </DrawerDescription>
          </DrawerHeader>

          {/* Footer Row Buttons */}
          <DrawerFooter className="flex-row gap-3 pb-6 px-4 pt-2">
            <Button 
              variant="outline" 
              onClick={handleReject}
              className="flex-1 h-10 rounded-xl text-sm border-gray-200"
            >
              Later
            </Button>
            <Button 
              onClick={handleAllow}
              className="flex-1 h-10 rounded-xl text-sm font-bold shadow-sm"
            >
              Allow
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}