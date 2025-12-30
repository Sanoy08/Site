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
      // ১. লগইন চেক
      if (!user) return;

      // ২. রিজেক্ট চেক
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

      // ৩. পারমিশন না থাকলে ২ সেকেন্ড পর ড্রয়ার ওপেন হবে
      if (status !== 'granted') {
        setTimeout(() => setIsOpen(true), 2000);
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
          <DrawerHeader className="flex flex-col items-center text-center pt-8">
            
            {/* বাউন্সিং আইকন */}
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-5 ring-4 ring-primary/5">
              <Bell className="h-10 w-10 text-primary animate-bounce" />
            </div>

            <DrawerTitle className="text-2xl font-bold">
              Turn on Notifications?
            </DrawerTitle>
            <DrawerDescription className="text-center text-gray-500 mt-3 text-base px-4">
              Don't miss out on your order updates, driver location, and special offers from <span className="font-semibold text-primary">Bumba's Kitchen</span>.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerFooter className="pb-8 px-6 gap-3">
            <Button 
              onClick={handleAllow}
              className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
            >
              Allow Notifications
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleReject}
              className="w-full h-12 text-base text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              Maybe Later
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}