// src/app/web/page.tsx

'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Download, Utensils, ChefHat, ShieldCheck, Smartphone, AlertTriangle, CheckCircle2, ArrowRight, Star, Settings, FileBox, Play, Info } from 'lucide-react';

// GSAP & Lenis Imports
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactLenis } from '@studio-freight/react-lenis';

export default function WebLandingPage() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      
      // 1. Header Animation (Cinematic Expo Ease)
      gsap.to('.header-anim', { y: 0, opacity: 1, duration: 1.5, ease: 'expo.out' });

      // 2. Hero Section Staggered Animation
      gsap.to('.hero-anim', {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.5,
        stagger: 0.15,
        ease: 'expo.out',
        delay: 0.2
      });

      // 3. Zig-Zag Steps Scroll Animations (Bar bar repeat hobe ebar)
      gsap.utils.toArray('.step-anim').forEach((step: any) => {
        gsap.to(step, {
          scrollTrigger: {
            trigger: step,
            start: "top 85%", 
            toggleActions: "play none none reverse" // 🌟 ADDED: For repeating animation on scroll up/down
          },
          x: 0,
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'expo.out'
        });
      });

      // 4. Curved Arrows Pop Animation (Bar bar repeat hobe ebar)
      gsap.utils.toArray('.arrow-anim').forEach((arrow: any) => {
        gsap.to(arrow, {
          scrollTrigger: {
            trigger: arrow,
            start: "top 85%",
            toggleActions: "play none none reverse" // 🌟 ADDED
          },
          scale: 1,
          opacity: 1,
          duration: 1,
          ease: 'elastic.out(1, 0.7)'
        });
      });

      // 5. Bento Grid Staggered Scroll Animation (Bar bar repeat hobe ebar)
      gsap.to('.bento-anim', {
        scrollTrigger: {
          trigger: '.bento-container',
          start: "top 85%",
          toggleActions: "play none none reverse" // 🌟 ADDED
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

  return (
    <ReactLenis root options={{ lerp: 0.05, duration: 1.5, smoothWheel: true }}>
        <div ref={containerRef} className="min-h-screen bg-[#fafafa] flex flex-col font-sans selection:bg-primary/20 overflow-x-hidden relative">
        
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        
        {/* Header */}
        <header className="header-anim opacity-0 -translate-y-full w-full py-4 px-6 flex justify-between items-center bg-white/70 backdrop-blur-xl border-b border-white/40 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 drop-shadow-sm">
                    <Image src="/logo.png" alt="Bumba's Kitchen Logo" fill className="object-contain" />
                </div>
                <h1 className="text-xl font-bold font-headline text-slate-800 tracking-tight">
                    Bumba's <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-500">Kitchen</span>
                </h1>
            </div>
        </header>

        <main className="flex-1 flex flex-col items-center w-full z-10">
            
            {/* Intro Section */}
            <section className="w-full px-5 pt-12 pb-6 flex flex-col items-center text-center relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10"></div>
            
            <h2 className="hero-anim opacity-0 translate-y-8 text-4xl sm:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight mb-4">
                Get Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-500">Official App</span>
            </h2>
            <p className="hero-anim opacity-0 translate-y-8 text-[15px] text-slate-500 max-w-sm leading-relaxed font-medium">
                Follow these simple steps to install the app and start ordering your favorite meals!
            </p>
            </section>

            {/* 🌟 Zig-Zag Steps Section with Arrows */}
            <section className="w-full max-w-md px-5 py-6 overflow-hidden">
                
                {/* ========================================== */}
                {/* --- STEP 1 START --- */}
<div className="flex items-center justify-between gap-4 w-full overflow-hidden">
    <div className="step-anim opacity-0 -translate-x-10 flex-1 text-left">
        <div className="w-8 h-8 rounded-full bg-primary text-white font-black flex items-center justify-center text-sm shadow-md mb-3">1</div>
        <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">Step One</h3>
        <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
            Description for step one goes here. Edit this text.
        </p>
    </div>
    
    {/* Mobile Image Container */}
    <div className="step-anim opacity-0 translate-x-10 w-[140px] sm:w-[150px] shrink-0 aspect-[9/16] rounded-[1.2rem] border-[4px] border-slate-800 bg-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 inset-x-0 h-3 w-1/2 mx-auto bg-slate-800 rounded-b-md z-10"></div>
{/* Image Container */}    
        <Image 
            src="https://images.bumbaskitchen.app/dk1acdtja/IMG_20260430_171208_yhxj25.jpg" 
            alt="Step 1" 
            fill 
            className="object-cover" // 👈 Er fole image stretch hobe na, crop hobe
            priority
        />
{/* Image Container */}
    </div>  
</div>
                {/* --- ARROW 1 --- */}
                <div className="w-full flex justify-center py-2 relative h-16">
                    <svg width="100" height="60" viewBox="0 0 100 60" className="arrow-anim opacity-0 scale-75 absolute top-0 right-16 sm:right-20 text-primary/40 overflow-visible drop-shadow-sm">
                        <path d="M 80,0 Q 80,50 10,50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
                        <path d="M 20,40 L 10,50 L 20,60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                {/* ========================================== */}

                {/* ========================================== */}
                {/* --- STEP 2 START --- */}
                <div className="flex items-center justify-between gap-4 w-full overflow-hidden">
                    <div className="step-anim opacity-0 -translate-x-10 w-[140px] sm:w-[150px] shrink-0 aspect-[9/16] rounded-[1.2rem] border-[4px] border-slate-800 bg-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-3 w-1/2 mx-auto bg-slate-800 rounded-b-md z-10"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-orange-300 bg-orange-50/50">
                            <AlertTriangle className="h-6 w-6 mb-1 opacity-50" />
                            <span className="text-[9px] font-bold text-center px-1">guide-2.jpg</span>
                        </div>
                    </div>
                    <div className="step-anim opacity-0 translate-x-10 flex-1 text-right flex flex-col items-end">
                        <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-black flex items-center justify-center text-sm shadow-md mb-3">2</div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">Step Two</h3>
                        <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                            Description for step two goes here. Edit this text.
                        </p>
                    </div>
                </div>
                {/* --- ARROW 2 --- */}
                <div className="w-full flex justify-center py-2 relative h-16">
                    <svg width="100" height="60" viewBox="0 0 100 60" className="arrow-anim opacity-0 scale-75 absolute top-0 left-16 sm:left-20 text-primary/40 overflow-visible drop-shadow-sm">
                        <path d="M 20,0 Q 20,50 90,50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
                        <path d="M 80,40 L 90,50 L 80,60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                {/* ========================================== */}

                {/* ========================================== */}
                {/* --- STEP 3 START --- */}
                <div className="flex items-center justify-between gap-4 w-full overflow-hidden">
                    <div className="step-anim opacity-0 -translate-x-10 flex-1 text-left">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white font-black flex items-center justify-center text-sm shadow-md mb-3">3</div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">Step Three</h3>
                        <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                            Description for step three goes here. Edit this text.
                        </p>
                    </div>
                    <div className="step-anim opacity-0 translate-x-10 w-[140px] sm:w-[150px] shrink-0 aspect-[9/16] rounded-[1.2rem] border-[4px] border-slate-800 bg-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-3 w-1/2 mx-auto bg-slate-800 rounded-b-md z-10"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-green-400 bg-green-50/50">
                            <CheckCircle2 className="h-6 w-6 mb-1 opacity-50" />
                            <span className="text-[9px] font-bold text-center px-1">guide-3.jpg</span>
                        </div>
                    </div>
                </div>
                {/* --- ARROW 3 --- */}
                <div className="w-full flex justify-center py-2 relative h-16">
                    <svg width="100" height="60" viewBox="0 0 100 60" className="arrow-anim opacity-0 scale-75 absolute top-0 right-16 sm:right-20 text-primary/40 overflow-visible drop-shadow-sm">
                        <path d="M 80,0 Q 80,50 10,50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
                        <path d="M 20,40 L 10,50 L 20,60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                {/* ========================================== */}

                {/* ========================================== */}
                {/* --- STEP 4 START --- */}
                <div className="flex items-center justify-between gap-4 w-full overflow-hidden">
                    <div className="step-anim opacity-0 -translate-x-10 w-[140px] sm:w-[150px] shrink-0 aspect-[9/16] rounded-[1.2rem] border-[4px] border-slate-800 bg-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-3 w-1/2 mx-auto bg-slate-800 rounded-b-md z-10"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-300 bg-blue-50/50">
                            <Settings className="h-6 w-6 mb-1 opacity-50" />
                            <span className="text-[9px] font-bold text-center px-1">guide-4.jpg</span>
                        </div>
                    </div>
                    <div className="step-anim opacity-0 translate-x-10 flex-1 text-right flex flex-col items-end">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-sm shadow-md mb-3">4</div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">Step Four</h3>
                        <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                            Description for step four goes here. Edit this text.
                        </p>
                    </div>
                </div>
                {/* --- ARROW 4 --- */}
                <div className="w-full flex justify-center py-2 relative h-16">
                    <svg width="100" height="60" viewBox="0 0 100 60" className="arrow-anim opacity-0 scale-75 absolute top-0 left-16 sm:left-20 text-primary/40 overflow-visible drop-shadow-sm">
                        <path d="M 20,0 Q 20,50 90,50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
                        <path d="M 80,40 L 90,50 L 80,60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                {/* ========================================== */}

                {/* ========================================== */}
                {/* --- STEP 5 START --- */}
                <div className="flex items-center justify-between gap-4 w-full overflow-hidden">
                    <div className="step-anim opacity-0 -translate-x-10 flex-1 text-left">
                        <div className="w-8 h-8 rounded-full bg-primary text-white font-black flex items-center justify-center text-sm shadow-md mb-3">5</div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">Step Five</h3>
                        <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                            Description for step five goes here. Edit this text.
                        </p>
                    </div>
                    <div className="step-anim opacity-0 translate-x-10 w-[140px] sm:w-[150px] shrink-0 aspect-[9/16] rounded-[1.2rem] border-[4px] border-slate-800 bg-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-3 w-1/2 mx-auto bg-slate-800 rounded-b-md z-10"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                            <FileBox className="h-6 w-6 mb-1 opacity-50" />
                            <span className="text-[9px] font-bold text-center px-1">guide-5.jpg</span>
                        </div>
                    </div>
                </div>
                {/* --- ARROW 5 --- */}
                <div className="w-full flex justify-center py-2 relative h-16">
                    <svg width="100" height="60" viewBox="0 0 100 60" className="arrow-anim opacity-0 scale-75 absolute top-0 right-16 sm:right-20 text-primary/40 overflow-visible drop-shadow-sm">
                        <path d="M 80,0 Q 80,50 10,50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
                        <path d="M 20,40 L 10,50 L 20,60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                {/* ========================================== */}

                {/* ========================================== */}
                {/* --- STEP 6 START --- */}
                <div className="flex items-center justify-between gap-4 w-full overflow-hidden">
                    <div className="step-anim opacity-0 -translate-x-10 w-[140px] sm:w-[150px] shrink-0 aspect-[9/16] rounded-[1.2rem] border-[4px] border-slate-800 bg-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-3 w-1/2 mx-auto bg-slate-800 rounded-b-md z-10"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-orange-300 bg-orange-50/50">
                            <Play className="h-6 w-6 mb-1 opacity-50" />
                            <span className="text-[9px] font-bold text-center px-1">guide-6.jpg</span>
                        </div>
                    </div>
                    <div className="step-anim opacity-0 translate-x-10 flex-1 text-right flex flex-col items-end">
                        <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-black flex items-center justify-center text-sm shadow-md mb-3">6</div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">Step Six</h3>
                        <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                            Description for step six goes here. Edit this text.
                        </p>
                    </div>
                </div>
                {/* --- ARROW 6 --- */}
                <div className="w-full flex justify-center py-2 relative h-16">
                    <svg width="100" height="60" viewBox="0 0 100 60" className="arrow-anim opacity-0 scale-75 absolute top-0 left-16 sm:left-20 text-primary/40 overflow-visible drop-shadow-sm">
                        <path d="M 20,0 Q 20,50 90,50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
                        <path d="M 80,40 L 90,50 L 80,60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                {/* ========================================== */}

                {/* ========================================== */}
                {/* --- STEP 7 START --- */}
                <div className="flex items-center justify-between gap-4 w-full overflow-hidden">
                    <div className="step-anim opacity-0 -translate-x-10 flex-1 text-left">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white font-black flex items-center justify-center text-sm shadow-md mb-3">7</div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">Step Seven</h3>
                        <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                            Description for step seven goes here. Edit this text.
                        </p>
                    </div>
                    <div className="step-anim opacity-0 translate-x-10 w-[140px] sm:w-[150px] shrink-0 aspect-[9/16] rounded-[1.2rem] border-[4px] border-slate-800 bg-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-3 w-1/2 mx-auto bg-slate-800 rounded-b-md z-10"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-green-400 bg-green-50/50">
                            <Info className="h-6 w-6 mb-1 opacity-50" />
                            <span className="text-[9px] font-bold text-center px-1">guide-7.jpg</span>
                        </div>
                    </div>
                </div>
                {/* --- ARROW 7 --- */}
                <div className="w-full flex justify-center py-2 relative h-16">
                    <svg width="100" height="60" viewBox="0 0 100 60" className="arrow-anim opacity-0 scale-75 absolute top-0 right-16 sm:right-20 text-primary/40 overflow-visible drop-shadow-sm">
                        <path d="M 80,0 Q 80,50 10,50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
                        <path d="M 20,40 L 10,50 L 20,60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                {/* ========================================== */}

                {/* ========================================== */}
                {/* --- STEP 8 START --- */}
                <div className="flex items-center justify-between gap-4 w-full overflow-hidden">
                    <div className="step-anim opacity-0 -translate-x-10 w-[140px] sm:w-[150px] shrink-0 aspect-[9/16] rounded-[1.2rem] border-[4px] border-slate-800 bg-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-3 w-1/2 mx-auto bg-slate-800 rounded-b-md z-10"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-300 bg-blue-50/50">
                            <CheckCircle2 className="h-6 w-6 mb-1 opacity-50" />
                            <span className="text-[9px] font-bold text-center px-1">guide-8.jpg</span>
                        </div>
                    </div>
                    <div className="step-anim opacity-0 translate-x-10 flex-1 text-right flex flex-col items-end">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-sm shadow-md mb-3">8</div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">Step Eight</h3>
                        <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                            Description for step eight goes here. Edit this text.
                        </p>
                    </div>
                </div>
                {/* --- STEP 8 END --- */}
                {/* ========================================== */}

            </section>

            {/* 🌟 Big Magical Download Button (Animated via Bento Stagger) */}
            <section className="bento-container w-full px-5 pt-8 pb-14 flex flex-col items-center">
                <div className="bento-anim opacity-0 translate-y-10 w-full max-w-[320px] relative group">
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-primary via-orange-400 to-primary rounded-[2rem] blur-md opacity-50 group-hover:opacity-80 transition duration-500 animate-pulse"></div>
                    
                    {/* ❗❗ REPLACE href="http://bumbaskitchen.app/bumbas-kitchen.apk" WITH YOUR ACTUAL APK LINK ❗❗ */}
                    <a 
                        href="/bumbas-kitchen.apk" 
                        className="relative flex items-center justify-between w-full bg-slate-900 text-white px-2 py-2.5 rounded-2xl font-bold text-lg shadow-2xl transition-transform active:scale-[0.97] overflow-hidden border border-white/10"
                    >
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>

                        <div className="flex items-center gap-3 pl-4 py-2">
                            <div className="bg-white/10 p-2.5 rounded-xl">
                                <Download className="h-7 w-7 text-primary animate-bounce" />
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Ready to order?</span>
                                <span className="leading-none text-[18px] tracking-wide">Download App</span>
                            </div>
                        </div>
                        <div className="bg-primary text-white h-full px-5 rounded-xl flex items-center justify-center shadow-inner">
                            <ArrowRight className="h-5 w-5" />
                        </div>
                    </a>
                    
                    <div className="flex items-center justify-center gap-4 mt-5">
                        <p className="text-[12px] text-slate-500 font-bold flex items-center gap-1.5 bg-white/60 px-4 py-2 rounded-full border border-slate-200 backdrop-blur-sm shadow-sm">
                            <ShieldCheck className="h-4 w-4 text-green-500" /> 100% Secure
                        </p>
                    </div>
                </div>
            </section>

            {/* 🌟 Why Choose Us (Bento Grid Style with GSAP) */}
            <section className="w-full bg-[#f8f9fa] py-14 px-5 border-t border-slate-100">
                <div className="max-w-md mx-auto bento-container">
                    <div className="text-center mb-8">
                        <h3 className="bento-anim opacity-0 translate-y-8 text-2xl font-black text-slate-900">Why Our App?</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bento-anim opacity-0 translate-y-10 bg-white p-5 rounded-[1.5rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-start gap-3">
                            <div className="h-10 w-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center border border-orange-100">
                                <ChefHat className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">Best Chefs</h4>
                                <p className="text-[11px] text-slate-500 mt-1 leading-snug">Cooked with love & hygiene.</p>
                            </div>
                        </div>

                        <div className="bento-anim opacity-0 translate-y-10 bg-white p-5 rounded-[1.5rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-start gap-3">
                            <div className="h-10 w-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center border border-green-100">
                                <Utensils className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">Daily Menus</h4>
                                <p className="text-[11px] text-slate-500 mt-1 leading-snug">New thalis every single day.</p>
                            </div>
                        </div>
                        
                        <div className="bento-anim opacity-0 translate-y-10 col-span-2 bg-gradient-to-br from-primary/10 to-orange-100 p-5 rounded-[1.5rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-primary/10 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">Exclusive App Offers</h4>
                                <p className="text-[12px] text-slate-600 mt-0.5 leading-snug">Get BK Coins & free delivery!</p>
                            </div>
                            <div className="h-10 w-10 bg-white text-primary rounded-full flex items-center justify-center shadow-sm">
                                <Star className="h-5 w-5 fill-primary" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </main>

        {/* Footer */}
        <footer className="w-full bg-white border-t border-slate-100 py-8 px-6 text-center mt-auto">
            <div className="flex justify-center items-center gap-2 mb-3">
                <div className="relative h-7 w-7 drop-shadow-sm">
                    <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="font-bold text-slate-800 tracking-tight text-sm">Bumba's Kitchen</span>
            </div>
            <p className="text-[10px] text-slate-400 max-w-[250px] mx-auto leading-relaxed">
                Please download our dedicated Android App to access the full ordering experience.
            </p>
            <div className="text-[9px] text-slate-300 mt-6 font-medium uppercase tracking-widest">
                &copy; {new Date().getFullYear()} All rights reserved.
            </div>
        </footer>

        </div>
    </ReactLenis>
  );
}