// src/app/web/page.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';

// GSAP & Lenis Imports
import gsap from 'gsap';
import { ReactLenis } from '@studio-freight/react-lenis';

export default function ComingSoonPage() {
  const containerRef = useRef(null);

  // 🌟 Target Date set to 10th October 2026
  const targetDate = new Date('2026-10-10T00:00:00').getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Real Countdown Logic
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header Animation
      gsap.to('.header-anim', { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out' });

      // Hero Elements Stagger
      gsap.to('.hero-anim', {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.4,
        stagger: 0.15,
        ease: 'expo.out',
        delay: 0.2
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.05, duration: 1.5, smoothWheel: true }}>
      <div ref={containerRef} className="min-h-screen bg-[#fffdfa] flex flex-col font-sans selection:bg-red-500/20 overflow-x-hidden relative">
        
        {/* Subtle Warm Festive Background Grid */}
        <div className="absolute inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#d977060a_1px,transparent_1px),linear-gradient(to_bottom,#d977060a_1px,transparent_1px)] bg-[size:16px_24px]"></div>
        
        {/* Header */}
        <header className="header-anim opacity-0 -translate-y-full w-full py-4 px-6 flex justify-between items-center bg-white/80 backdrop-blur-xl border-b border-red-900/10 sticky top-0 z-50 shadow-[0_4px_30px_rgba(185,28,28,0.03)]">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 drop-shadow-sm">
              <Image src="/LOGO.png" alt="Bumba's Kitchen Logo" fill className="object-contain" />
            </div>
            <h1 className="text-lg font-bold font-headline text-slate-900 tracking-tight">
              Bumba's <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-600">Kitchen</span>
            </h1>
          </div>
          <div className="bg-red-50 text-red-700 px-3.5 py-1 rounded-full text-xs font-bold border border-red-200 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            Sharodiya Special 🪷
          </div>
        </header>

        {/* Main Content (Centered) */}
        <main className="flex-1 flex flex-col items-center justify-center w-full z-10 px-5">
          
          <section className="w-full max-w-lg flex flex-col items-center text-center relative py-12">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-red-600/15 to-amber-500/20 rounded-full blur-[100px] -z-10"></div>
            
            <div className="hero-anim opacity-0 translate-y-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold mb-6 tracking-wide uppercase shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-spin" /> আসছে পুজোয় জমজমাট আয়োজন
            </div>

            <h2 className="hero-anim opacity-0 translate-y-8 text-4xl sm:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight mb-4">
              Pujo Special App is <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-orange-600 to-amber-600">Launching Soon!</span>
            </h2>
            
            <p className="hero-anim opacity-0 translate-y-8 text-sm sm:text-base text-slate-600 max-w-md leading-relaxed font-medium mb-10">
              এই পুজোর আনন্দে ঘরে বসেই উপভোগ করুন স্পেশাল থালি ও ঐতিহ্যবাহী বাঙালি পদ। আমাদের নতুন অ্যাপ লঞ্চ হচ্ছে খুব শীঘ্রই, চোখ রাখুন!
            </p>

            {/* 🌟 Live Countdown Timer Box */}
            <div className="hero-anim opacity-0 translate-y-8 grid grid-cols-4 gap-2.5 w-full max-w-sm">
              <div className="bg-white p-3.5 rounded-2xl border border-red-900/10 shadow-sm flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Days</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-red-900/10 shadow-sm flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Hours</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-red-900/10 shadow-sm flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Mins</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-red-900/10 shadow-sm flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-black text-amber-600">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Secs</span>
              </div>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="w-full bg-white border-t border-red-900/10 py-6 px-6 text-center mt-auto">
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="relative h-6 w-6">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="font-bold text-slate-800 text-xs">Bumba's Kitchen</span>
          </div>
          <div className="text-[9px] text-slate-500 font-medium uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Shubh Sharodiya. All rights reserved.
          </div>
        </footer>

      </div>
    </ReactLenis>
  );
}
