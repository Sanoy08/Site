// src/app/web/page.tsx
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChefHat, Smartphone, Star, Clock, ShieldCheck, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Apnar cloudinary image tai ekhane demo hisebe bebohar korlam
const HERO_IMAGE = "https://res.cloudinary.com/dk1acdtja/image/upload/v1777168123/IMG_20260426_071347_fltctm.jpg";

export default function WebLandingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 font-sans overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 p-2 rounded-xl text-white shadow-md">
              <ChefHat className="h-5 w-5" />
            </div>
            <span className="font-black text-xl tracking-tight text-gray-800">Bumba's<span className="text-amber-500">Kitchen</span></span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-500">
            <MapPin className="h-4 w-4 text-amber-500" /> Janai, Hooghly
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        
        {/* Hero Section */}
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-12 lg:gap-8 pt-8 lg:pt-16">
          
          {/* Left Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex-1 space-y-8 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Top Rated Cloud Kitchen
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight text-gray-900">
              Craving <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Delicious</span><br /> Home Style Food?
            </h1>
            
            <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Experience the best Bengali cuisines and daily special thalis cooked with love, hygiene, and the freshest ingredients. Delivered blazing fast to your doorstep.
            </p>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 max-w-lg mx-auto lg:mx-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -z-10"></div>
                <h3 className="text-xl font-bold mb-2 flex items-center justify-center lg:justify-start gap-2">
                    <Smartphone className="h-6 w-6 text-amber-500" /> Get the App Now!
                </h3>
                <p className="text-sm text-gray-500 mb-6">To place an order, track your delivery live, and get exclusive daily discounts, please download our mobile app.</p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                    {/* Fake Play Store Button */}
                    <button className="flex items-center gap-3 bg-black text-white px-5 py-3 rounded-2xl hover:scale-105 transition-transform w-full sm:w-auto justify-center shadow-lg">
                        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186c-.135-.111-.22-.27-.22-.444V2.258c0-.174.085-.333.22-.444zm11.002 9.37l3.655-2.11-4.838-4.838 1.183 6.948zm.001 1.631l-1.183 6.949 4.838-4.838-3.655-2.111zm4.498-2.6L22.7 11.13c.4.23.4.606 0 .837l-3.59 2.073-1.428-1.428 1.428-1.428z"/></svg>
                        <div className="text-left">
                            <div className="text-[10px] uppercase leading-none opacity-80">GET IT ON</div>
                            <div className="text-base font-semibold leading-none mt-1">Google Play</div>
                        </div>
                    </button>
                    
                    <button className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group w-full sm:w-auto justify-center mt-2 sm:mt-0">
                        Download APK <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
          </motion.div>

          {/* Right Image Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="flex-1 w-full max-w-lg relative"
          >
            <div className="relative w-full aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-amber-50">
              <Image 
                src={HERO_IMAGE} 
                alt="Bumba's Kitchen Special Thali" 
                fill 
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            {/* Floating Badge */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce">
                <div className="bg-green-100 p-2 rounded-full text-green-600"><Star className="h-5 w-5 fill-green-600" /></div>
                <div>
                    <p className="text-xs text-gray-500 font-medium">Daily Special</p>
                    <p className="font-bold text-gray-900">Always Fresh</p>
                </div>
            </div>
          </motion.div>

        </div>

        {/* Features Section */}
        <div className="mt-32">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900">Why choose us?</h2>
                <p className="text-gray-500 mt-2">We deliver happiness packed in a box.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={<ChefHat className="h-6 w-6 text-orange-500" />}
                    title="Authentic Taste"
                    desc="Prepared by expert chefs using traditional recipes and premium spices."
                    bg="bg-orange-50"
                />
                <FeatureCard 
                    icon={<Clock className="h-6 w-6 text-blue-500" />}
                    title="Superfast Delivery"
                    desc="Hot and fresh food delivered right to your door in record time."
                    bg="bg-blue-50"
                />
                <FeatureCard 
                    icon={<ShieldCheck className="h-6 w-6 text-green-500" />}
                    title="100% Hygienic"
                    desc="Strict safety and hygiene protocols maintained in our cloud kitchen."
                    bg="bg-green-50"
                />
            </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center mt-20">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
            <ChefHat className="h-6 w-6" />
            <span className="font-black text-xl tracking-tight">Bumba'sKitchen</span>
          </div>
          <p className="text-sm text-gray-500 font-medium">
             © {new Date().getFullYear()} Bumba's Kitchen. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-2">Janai, Garbagan, Hooghly, West Bengal</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, bg }: { icon: React.ReactNode, title: string, desc: string, bg: string }) {
    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center transition-all hover:shadow-xl"
        >
            <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${bg}`}>
                {icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
        </motion.div>
    );
}