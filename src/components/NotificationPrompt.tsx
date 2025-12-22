'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth'; // আপনার Auth হুক
import { Bell, BellOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';

export default function NotificationPrompt() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      // ১. যদি ইউজার লগ-ইন না থাকে, তবে দেখাবে না
      if (!user) return;

      // ২. যদি ইউজার আগে একবার "Reject" করে থাকে (লোকাল স্টোরেজ চেক), তবে আর বিরক্ত করবে না
      const hasRejected = localStorage.getItem('notification-rejected');
      if (hasRejected) return;

      let status = '';

      if (Capacitor.isNativePlatform()) {
        // অ্যাপের জন্য চেক
        const permStatus = await PushNotifications.checkPermissions();
        status = permStatus.receive;
      } else {
        // ওয়েবসাইটের জন্য চেক
        if (!('Notification' in window)) return;
        status = Notification.permission;
      }

      // ৩. যদি পারমিশন 'granted' না হয়, তবেই পপ-আপ দেখাও
      if (status !== 'granted') {
        // অ্যাপ ওপেন হওয়ার ২ সেকেন্ড পর পপ-আপ আসবে (স্মুথ এক্সপেরিয়েন্সের জন্য)
        setTimeout(() => setIsOpen(true), 2000);
      }
    };

    checkPermission();
  }, [user]);

  const handleAllow = async () => {
    try {
      let permissionGranted = false;

      if (Capacitor.isNativePlatform()) {
        // Native App Logic
        const result = await PushNotifications.requestPermissions();
        if (result.receive === 'granted') {
          await PushNotifications.register();
          permissionGranted = true;
        }
      } else {
        // Web Logic
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
        // ইউজার সিস্টেম পপ-আপে ডিনাই করলে
        toast.error("Permission denied via system settings.");
        setIsOpen(false);
      }

    } catch (error) {
      console.error("Error requesting permission:", error);
      setIsOpen(false);
    }
  };

  const handleReject = () => {
    // ইউজার রিজেক্ট করলে লোকাল স্টোরেজে সেভ করে রাখব
    // যাতে বারবার অ্যাপ খুললেই বিরক্ত না করে
    localStorage.setItem('notification-rejected', 'true');
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-[90%] sm:max-w-md rounded-2xl">
        <AlertDialogHeader className="flex flex-col items-center text-center">
          
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-primary animate-bounce" />
          </div>
          
          <AlertDialogTitle className="text-xl font-bold">
            Enable Notifications?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-gray-600 mt-2">
            Get real-time updates on your <b>Order Status</b>, exclusive <b>Discounts</b>, and <b>Delivery Tracking</b>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-row gap-3 mt-4 sm:justify-center w-full">
          <Button 
            variant="outline" 
            onClick={handleReject}
            className="flex-1 rounded-xl h-11 border-gray-200 text-gray-500 hover:text-gray-700"
          >
            Not Now
          </Button>
          <Button 
            onClick={handleAllow}
            className="flex-1 rounded-xl h-11 font-bold shadow-md shadow-primary/20"
          >
            Allow
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}