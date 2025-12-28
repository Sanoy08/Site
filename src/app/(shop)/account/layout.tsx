// src/app/(shop)/account/layout.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20">
        {/* ★★★ FIX: px-4 যোগ করা হয়েছে যাতে সাব-পেজগুলো edge-to-edge না হয় ★★★ */}
        <div className="mx-auto max-w-md md:max-w-3xl bg-white min-h-screen px-4 md:px-6 pt-4">
            {children}
        </div>
    </div>
  );
}