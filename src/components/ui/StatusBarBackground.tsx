// src/components/ui/StatusBarBackground.tsx
'use client';

export function StatusBarBackground() {
  return (
    <div 
      className="fixed top-0 left-0 right-0 bg-white z-[9999]"
      style={{
        // আইফোনের নচ এর সমান হাইট নেবে
        height: 'env(safe-area-inset-top)',
        // এন্ড্রয়েডে যদি ওভারলে ফলস থাকে, তাহলে এটার হাইট ০ হবে (অটোমেটিক হ্যান্ডেল হবে)
      }}
    />
  );
}