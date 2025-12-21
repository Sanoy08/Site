// src/components/ui/StatusBarBackground.tsx
'use client';

export function StatusBarBackground() {
  return (
    <div 
      className="fixed top-0 left-0 right-0 bg-white z-[99999]"
      style={{
        // আমরা globals.css এ ডিফাইন করা ভেরিয়েবল ব্যবহার করছি
        height: 'var(--safe-top)',
      }}
    />
  );
}