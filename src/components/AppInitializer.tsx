// src/components/AppInitializer.tsx

'use client';

import { usePushNotification } from '@/hooks/use-push-notification';
import { useBackButton } from '@/hooks/use-back-button';

export function AppInitializer() {
  // হুকগুলো কল করা হচ্ছে
  usePushNotification();
  useBackButton();

  // এই কম্পোনেন্টটি নিজে কিছু রেন্ডার করবে না
  return null; 
}