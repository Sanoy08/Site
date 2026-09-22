// src/app/web/page.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Utensils, Bell } from 'lucide-react';

// GSAP & Lenis Imports
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactLenis } from '@studio-freight/react-lenis';

export default function ComingSoonPage() {
  const containerRef = useRef(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

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
    gsap.registerPlugin(ScrollTrigger);

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

      // Bento features animation
      gsap.to('.bento-anim', {
        scrollTrigger: {
          trigger: '.bento-container',
          start: "top 85%",
          toggleActions: "play none none reverse"
        },
        y: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.15,
        ease: 'expo.out'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <ReactLenis root options={{ lerp: 0.05, duration: 1.5, smoothWheel: true }}>
      <div ref={containerRef} className="min-h-screen bg-[#fffdfa] flex flex-col font-sans selection:bg-red-500/20 overflow-x-hidden relative">
        
        {/* Subtle Warm Festive Background Grid */}
        <div className="absolute inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#d977060a_1px,transparent_1px),linear-gradient(to_bottom,#d977060a_1px,transparent_1px)] bg-[size:16px_24px]"></div>
        
        {/* Header */}
        <header className="header-anim opacity-0 -translate-y-full w-full py-4 px-6 flex justify-between items-center bg-white/80 backdrop-blur-xl border-b border-red-900/10 sticky top-0 z-50 shadow-[0_4px_30px_rgba(185,28,28,0.03)]">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 drop-shadow-sm">
              <Image src="/logo.png" alt="Bumba's Kitchen Logo" fill className="object-contain" />
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

        <main className="flex-1 flex flex-col items-center w-full z-10 px-5">
          
          {/* Hero Section */}
          <section className="w-full max-w-lg pt-16 pb-10 flex flex-col items-center text-center relative">
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-tr from-red-600/15 to-amber-500/20 rounded-full blur-[100px] -z-10"></div>
            
            <div className="hero-anim opacity-0 translate-y-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold mb-6 tracking-wide uppercase shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-spin" /> আসছে পুজোয় জমজমাট আয়োজন
            </div>

            <h2 className="hero-anim opacity-0 translate-y-8 text-4xl sm:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight mb-4">
              Pujo Special App is <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-orange-600 to-amber-600">Launching Soon!</span>
            </h2>
            
            <p className="hero-anim opacity-0 translate-y-8 text-sm sm:text-base text-slate-600 max-w-md leading-relaxed font-medium mb-8">
              এই পুজোর আনন্দে ঘরে বসেই উপভোগ করুন স্পেশাল থালি ও ঐতিহ্যবাহী বাঙালি পদ। এক্সক্লুসিভ অফার পেতে আজই ওয়েটলিস্টে নাম রেজিস্টার করুন!
            </p>

            {/* 🌟 Live Countdown Timer Box (Target: 10th Oct 2026) */}
            <div className="hero-anim opacity-0 translate-y-8 grid grid-cols-4 gap-2.5 w-full max-w-sm mb-8">
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

            {/* Waitlist Form */}
            <div className="hero-anim opacity-0 translate-y-8 w-full max-w-md">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl border border-red-900/15 shadow-xl">
                  <div className="relative flex-1">
                    <input 
                      type="email" 
                      required
                      placeholder="আপনার ইমেল অ্যাড্রেস লিখুন..." 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>Notify Me</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-5 py-4 rounded-2xl flex items-center gap-3 text-sm font-semibold shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0" />
                  <span>অভিনন্দন! আপনি ওয়েটলিস্টে যুক্ত হয়েছেন। লঞ্চ হওয়ামাত্র জানিয়ে দেওয়া হবে।</span>
                </div>
              )}
              <p className="text-[11px] text-slate-500 mt-3 flex items-center justify-center gap-1 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" /> কোনো স্প্যাম নয়। নিরাপদে আপডেট পান।
              </p>
            </div>
          </section>

          {/* App Preview Mockup Teaser */}
          <section className="w-full max-w-sm py-6 flex justify-center">
            <div className="hero-anim opacity-0 translate-y-10 w-[200px] aspect-[9/16] rounded-[2rem] border-[6px] border-slate-900 bg-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-4 w-1/2 mx-auto bg-slate-900 rounded-b-xl z-10"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-gradient-to-b from-red-50 to-amber-50/50">
                <Utensils className="h-10 w-10 mb-2 text-red-600 opacity-70 animate-bounce" />
                <span className="text-xs font-bold text-slate-700">Pujo Thali Preview</span>
                <span className="text-[10px] text-red-600 font-semibold">Coming Oct 10</span>
              </div>
            </div>
          </section>

          {/* Bento Grid Features Preview */}
          <section className="bento-container w-full max-w-md py-10">
            <div className="text-center mb-6">
              <h3 className="bento-anim opacity-0 translate-y-6 text-xl font-bold text-slate-900">পুজো স্পেশাল অফার</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bento-anim opacity-0 translate-y-8 bg-white p-4 rounded-2xl border border-red-900/10 shadow-sm flex flex-col gap-2">
                <div className="h-8 w-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-bold">🪷</div>
                <h4 className="font-bold text-slate-900 text-xs">महाभोज থালি</h4>
                <p className="text-[10px] text-slate-600 leading-snug">পুজোর চারদিন স্পেশাল মেনু ও হোম ডেলিভারি।</p>
              </div>
              <div className="bento-anim opacity-0 translate-y-8 bg-white p-4 rounded-2xl border border-red-900/10 shadow-sm flex flex-col gap-2">
                <div className="h-8 w-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold">🪙</div>
                <h4 className="font-bold text-slate-900 text-xs">Pujo Cashback</h4>
                <p className="text-[10px] text-slate-600 leading-snug">अर्লি ওয়েটলিস্ট ইউজারদের জন্য স্পেশাল BK Coins।</p>
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
