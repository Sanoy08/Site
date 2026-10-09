// src/app/web/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Sparkles, Download, ArrowRight, Utensils } from 'lucide-react';

// GSAP & Lenis Imports
import gsap from 'gsap';
import { ReactLenis } from '@studio-freight/react-lenis';

export default function AppLaunchedPage() {
  const containerRef = useRef(null);

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
          <div className="bg-green-50 text-green-700 px-3.5 py-1 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
            App is Live Now 🚀
          </div>
        </header>

        {/* Main Content (Centered) */}
        <main className="flex-1 flex flex-col items-center justify-center w-full z-10 px-5">
          
          <section className="w-full max-w-2xl flex flex-col items-center text-center relative py-12">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-red-600/15 to-amber-500/20 rounded-full blur-[100px] -z-10"></div>
            
            <div className="hero-anim opacity-0 translate-y-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold mb-6 tracking-wide uppercase shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-spin" /> শুভ শারদীয়া - স্পেশাল অফার
            </div>

            <h2 className="hero-anim opacity-0 translate-y-8 text-4xl sm:text-6xl font-black text-slate-900 leading-[1.15] tracking-tight mb-4">
              Bumba's Kitchen App is <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-orange-600 to-amber-600">Now Live!</span>
            </h2>
            
            <p className="hero-anim opacity-0 translate-y-8 text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed font-medium mb-10">
              অবশেষে অপেক্ষার অবসান! আমাদের নতুন অ্যাপ থেকে আপনার প্রিয় খাবার অর্ডার করুন আর উপভোগ করুন পূজোর স্পেশাল সব ডিসকাউন্ট।
            </p>

            {/* Promo Code Box */}
            <div className="hero-anim opacity-0 translate-y-8 mb-10 w-full max-w-lg">
              <p className="text-[15px] font-bold text-amber-700 mb-4 bg-amber-50 inline-block px-4 py-1.5 rounded-full border border-amber-200 shadow-sm">
                দুর্গাপুজোর স্পেশাল মেনু অর্ডারে কুপনগুলো ব্যবহার করুন! 🎉
              </p>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                <div className="bg-white border-2 border-dashed border-red-400 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <span className="font-black text-xl text-red-600 tracking-wider">UMAA7</span>
                </div>
                <div className="bg-white border-2 border-dashed border-red-400 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <span className="font-black text-xl text-red-600 tracking-wider">MAA4</span>
                </div>
                <div className="bg-white border-2 border-dashed border-red-400 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <span className="font-black text-xl text-red-600 tracking-wider">SHAROD2</span>
                </div>
              </div>
            </div>

            {/* Action Buttons & QR Code */}
            <div className="hero-anim opacity-0 translate-y-8 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full mt-4">
              
              {/* Google Play Button */}
              <div className="flex flex-col items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 md:hidden">Tap to Download</p>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.bumbaskitchen.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 rounded-lg inline-block"
                >
                  <img 
                    src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                    alt="Get it on Google Play" 
                    className="h-[100px] sm:h-[120px] w-auto object-contain drop-shadow-md"
                  />
                </a>
              </div>

              {/* QR Code (Visible mainly on PC/Tablets) */}
              <div className="hidden md:flex flex-col items-center p-4 bg-white/50 backdrop-blur-sm border-2 border-dashed border-red-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[11px] font-black text-red-600 uppercase tracking-wider mb-3">Scan to Download 📱</p>
                <img 
                  src="https://i.pinimg.com/736x/b0/f3/84/b0f38445ce23a45b4bae6f2281a826aa.jpg" 
                  alt="QR Code Placeholder" 
                  className="h-80 w-80 object-contain rounded-lg shadow-sm" 
                />
              </div>

            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="w-full bg-white border-t border-red-900/10 py-6 px-6 text-center mt-auto">
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="relative h-6 w-6">
              <Image src="/LOGO.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="font-bold text-slate-800 text-xs">Bumba's Kitchen</span>
          </div>
          <div className="text-[9px] text-slate-500 font-medium uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Shubho Sharodiya. All rights reserved.
          </div>
        </footer>

      </div>
    </ReactLenis>
  );
}
