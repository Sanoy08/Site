// src/components/shop/HomeClient.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Rating } from '@/components/shared/Rating';
import Image from 'next/image';
import Link from 'next/link';
import { MobileNav } from '@/components/layout/MobileNav';
import { ProductCard } from '@/components/shop/ProductCard';
import Autoplay from "embla-carousel-autoplay";
import { formatPrice } from '@/lib/utils';
import { PLACEHOLDER_IMAGE_URL } from '@/lib/constants';
import type { Product } from '@/lib/types';
import { Utensils, Truck, ShieldCheck, Leaf } from 'lucide-react';
import { SpecialDishCard } from './SpecialDishCard';

export type HeroSlide = { id: string; imageUrl: string; clickUrl: string; };
export type Offer = { id: string; title: string; description: string; price: number; imageUrl: string; };
type HomeClientProps = { 
  heroSlides: HeroSlide[]; 
  offers: Offer[]; 
  bestsellers: Product[]; 
  allProducts?: Product[]; 
};

const getOptimizedUrl = (url: string, type: 'hero' | 'offer' | 'zoom') => {
  if (!url) return PLACEHOLDER_IMAGE_URL;

  // ১. যদি ইমেজটি Cloudinary-র হয়, তবেই আমরা প্রক্সি করব
  if (url.includes('cloudinary.com')) {
    
    // ২. অ্যাকাউন্ট টাইপ ডিটেক্ট করা (.env ফাইল অনুযায়ী)
    let accountType = 'general'; // ডিফল্ট
    
    // যদি লিঙ্কে Dishes Cloud Name (dk1acdtja) থাকে, তবে সেটা 'menu'
    if (url.includes('dk1acdtja')) {
        accountType = 'menu';
    } 
    // যদি লিঙ্কে General Cloud Name (dhhfisazd) থাকে, তবে সেটা 'general'
    else if (url.includes('dhhfisazd')) {
        accountType = 'general';
    }

    // ৩. সাইজ এবং ফরম্যাট প্যারামিটার সেট করা (ব্যান্ডউইথ বাঁচাতে)
    let params = '';
    switch (type) {
        case 'hero':
            // Hero: 800px, Low Quality, AVIF
            params = 'image/upload/w_800,q_auto:low,f_avif'; 
            break;
        case 'offer':
            // Offer: 500px, Low Quality, AVIF
            params = 'image/upload/w_500,q_auto:low,f_avif';
            break;
        case 'zoom':
            // Zoom: 1000px, Good Quality, AVIF
            params = 'image/upload/w_1000,q_auto:good,f_avif';
            break;
        default:
            params = 'image/upload/q_auto,f_avif';
    }

    // ৪. অরিজিনাল পাথ বের করা (v1234/xyz.jpg অংশটুকু)
    const parts = url.split('/upload/');
    if (parts.length < 2) return url; // যদি ফরম্যাট না মেলে
    const pathAfterUpload = parts[1];

    // ৫. ফাইনাল Cloudflare URL রিটার্ন করা
    // যেমন: https://images.bumbaskitchen.app/menu/image/upload/w_500.../v123/food.jpg
    return `https://images.bumbaskitchen.app/${accountType}/${params}/${pathAfterUpload}`;
  }

  // অন্য কোনো ইমেজের ক্ষেত্রে (যেমন লোকাল বা অন্য লিঙ্ক)
  return url;
};

const CATEGORIES = [
    { name: "All", image: "/Categories/9.webp", link: "/menus", color: "from-gray-400 to-slate-600" },
    { name: "Chicken", image: "/Categories/7.webp", link: "/menus?category=chicken", color: "from-red-400 to-rose-600" },
    { name: "Mutton", image: "/Categories/4.webp", link: "/menus?category=mutton", color: "from-amber-500 to-orange-700" },
    { name: "Rice", image: "/Categories/2.webp", link: "/menus?category=rice", color: "from-yellow-300 to-orange-400" },    
    { name: "Fish", image: "/Categories/3.webp", link: "/menus?category=fish", color: "from-cyan-400 to-blue-500" },
    { name: "Paneer", image: "/Categories/8.webp", link: "/menus?category=paneer", color: "from-blue-400 to-indigo-500" },
    { name: "Fried", image: "/Categories/5.webp", link: "/menus?category=fried", color: "from-green-400 to-emerald-600" },
    { name: "Chapati", image: "/Categories/6.webp", link: "/menus?category=chapati", color: "from-orange-300 to-yellow-600" },
    { name: "Veg", image: "/Categories/1.webp", link: "/menus?category=veg", color: "from-green-400 to-lime-600" },
];

const FEATURES = [
    { icon: Truck, title: "Safe & Secure", desc: "Get Secured Delivery", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: Leaf, title: "Fresh & Organic", desc: "Farm fresh ingredients", color: "text-green-500", bg: "bg-green-50" },
    { icon: ShieldCheck, title: "Safety First", desc: "100% Hygienic Kitchen", color: "text-purple-500", bg: "bg-purple-50" },
];

const testimonials = [
    { name: 'Ishita M.', location: 'Kolkata', rating: 5, quote: "The food is very tasty and the price is reasonable. A must try!" },
    { name: 'Rohan G.', location: 'Hooghly', rating: 4.5, quote: "Amazing home-style food! The chicken kosha was simply out of this world." },
    { name: 'Priya S.', location: 'Serampore', rating: 5, quote: "Bumba's Kitchen is my go-to for weekend meals. Consistent quality!" },
    { name: 'Ankit B.', location: 'Konnagar', rating: 4, quote: "Ordered the veg thali and it was wholesome and delicious. Highly recommended!" }
];

export function HomeClient({ heroSlides, offers, bestsellers, allProducts = [] }: HomeClientProps) {
  const [heroApi, setHeroApi] = useState<CarouselApi>()
  const [heroCurrent, setHeroCurrent] = useState(0)
  const [heroCount, setHeroCount] = useState(0)

  const [offerApi, setOfferApi] = useState<CarouselApi>()
  const [offerCurrent, setOfferCurrent] = useState(0)
  const [offerCount, setOfferCount] = useState(0)

  const [bestsellerApi, setBestsellerApi] = useState<CarouselApi>()
  const [bestsellerCurrent, setBestsellerCurrent] = useState(0)
  const [bestsellerCount, setBestsellerCount] = useState(0)
  
  const dailySpecial = allProducts.find(p => p.isDailySpecial);

  useEffect(() => {
    if (!heroApi) return
    setHeroCount(heroApi.scrollSnapList().length)
    setHeroCurrent(heroApi.selectedScrollSnap())
    heroApi.on("select", () => setHeroCurrent(heroApi.selectedScrollSnap()))
  }, [heroApi])

  useEffect(() => {
    if (!offerApi) return
    setOfferCount(offerApi.scrollSnapList().length)
    setOfferCurrent(offerApi.selectedScrollSnap())
    offerApi.on("select", () => setOfferCurrent(offerApi.selectedScrollSnap()))
  }, [offerApi])

  useEffect(() => {
    if (!bestsellerApi) return
    setBestsellerCount(bestsellerApi.scrollSnapList().length)
    setBestsellerCurrent(bestsellerApi.selectedScrollSnap())
    bestsellerApi.on("select", () => setBestsellerCurrent(bestsellerApi.selectedScrollSnap()))
  }, [bestsellerApi])

  return (
    <div className="bg-background pb-20 md:pb-0">
      
      {/* 1. Hero Section */}
      <section className="relative -mt-20 md:-mt-24 w-full">
        {heroSlides.length > 0 ? (
          <>
            <Carousel setApi={setHeroApi} opts={{ loop: true }} plugins={[Autoplay({ delay: 5000 })]}>
              <CarouselContent>
                {heroSlides.map((slide) => (
                  <CarouselItem key={slide.id}>
                    <Link href={slide.clickUrl} className="block w-full relative">
                      <Image 
                        src={slide.imageUrl} 
                        alt="Hero Slide" 
                        width={0}
                        height={0}
                        sizes="100vw"
                        style={{ width: '100%', height: 'auto' }}
                        className="object-contain" 
                        priority 
                        unoptimized={true} 
                      />
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            
            {/* Hero Dots (White) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {Array.from({ length: heroCount }).map((_, index) => (
                <button 
                    key={index} 
                    onClick={() => heroApi?.scrollTo(index)} 
                    className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${heroCurrent === index ? 'w-8 bg-white' : 'w-2 bg-white/60'}`} 
                />
              ))}
            </div>
          </>
        ) : (
           <div className="relative h-[50vh] md:h-screen overflow-hidden bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                  <h1 className="text-4xl font-bold text-primary mb-4 font-headline">Bumba's Kitchen</h1>
                  <Button asChild size="lg" className="rounded-full"><Link href="/menus">Order Now</Link></Button>
              </div>
           </div>
        )}
      </section>

      {/* 2. Category Slider */}
      <section className="py-8 md:py-12 bg-background">
          <div className="container">
              <div className="flex items-center justify-between mb-6 px-1">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <Utensils className="h-5 w-5 text-primary" /> What's on your mind?
                  </h3>
              </div>
              
              <div className="flex gap-4 md:gap-8 overflow-x-auto pb-6 pt-2 px-1 scrollbar-hide">
                  {CATEGORIES.map((cat, idx) => (
                      <Link key={idx} href={cat.link} className="flex flex-col items-center gap-3 min-w-[85px] group cursor-pointer">
                          <div className={`relative h-20 w-20 md:h-24 md:w-24 rounded-full p-1 bg-gradient-to-tr ${cat.color} shadow-lg group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300`}>
                              <div className="relative h-full w-full rounded-full overflow-hidden border-2 border-white bg-white">
                                  <Image 
                                    src={cat.image} 
                                    alt={cat.name} 
                                    fill 
                                    className="object-cover group-hover:scale-110 transition-transform duration-500" 
                                    unoptimized={true}
                                  />
                              </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700 group-hover:text-primary transition-colors">{cat.name}</span>
                      </Link>
                  ))}
              </div>
          </div>
      </section>

      {/* 3. Trust Badges */}
      <section className="py-8 bg-gray-50/50 border-y border-gray-100">
          <div className="container">
              <div className="grid grid-cols-3 gap-3 md:gap-8">
                  {FEATURES.map((feat, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center p-3 md:p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full ${feat.bg} flex items-center justify-center mb-2 md:mb-3`}>
                              <feat.icon className={`h-5 w-5 md:h-6 md:w-6 ${feat.color}`} />
                          </div>
                          <h3 className="font-bold text-xs md:text-base text-gray-900">{feat.title}</h3>
                          <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5 hidden md:block">{feat.desc}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* 4. Daily Special Section */}
      {dailySpecial && (
        <section className="py-16 bg-amber-50/50">
            <div className="container">
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary">Today's Special</h2>
                    <p className="text-muted-foreground mt-2">Freshly prepared just for you.</p>
                </div>

                <div className="max-w-md mx-auto bg-white p-4 rounded-3xl shadow-xl border border-amber-100 hover:shadow-2xl transition-shadow duration-300">
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-sm bg-muted">
                         {dailySpecial.images && dailySpecial.images.length > 0 && dailySpecial.images[0].url ? (
                            <Image 
                                src={dailySpecial.images[0].url}
                                alt={dailySpecial.name}
                                fill
                                className="object-cover"
                                unoptimized={true}
                             />
                         ) : (
                             <SpecialDishCard 
                                name={dailySpecial.name} 
                                description={dailySpecial.description} 
                                price={dailySpecial.price} 
                             />
                         )}
                    </div>

                    <div className="mt-6 px-2 pb-2">
                        <Button asChild size="lg" className="w-full rounded-xl text-lg font-bold h-14 shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform">
                            <Link href={`/menus/${dailySpecial.slug}`}>
                                Order Now - {formatPrice(dailySpecial.price)}
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
      )}

      {/* 5. Upcoming Offers */}
      {offers.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-3xl font-bold font-headline text-gray-900">Hot Offers 🔥</h2>
                    <p className="text-muted-foreground mt-1">Grab the best deals before they are gone.</p>
                </div>
            </div>
            
            <Carousel setApi={setOfferApi} opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent>
                    {offers.map((offer) => (
                    <CarouselItem key={offer.id} className="md:basis-1/2 lg:basis-1/3 pl-4">
                        <div className="p-1 h-full">
                        <Card className="overflow-hidden group h-full border-none shadow-md rounded-2xl bg-card hover:shadow-xl transition-shadow">
                            <CardContent className="p-0 relative">
                            <Image 
                                src={getOptimizedUrl(offer.imageUrl)} 
                                alt={offer.title} 
                                width={0}
                                height={0}
                                sizes="100vw"
                                style={{ width: '100%', height: 'auto' }}
                                className="block"
                                unoptimized={true} 
                            />
                            </CardContent>
                        </Card>
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* ★★★ Offer Dots (Reverted to Expanding Pill Style) ★★★ */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: offerCount }).map((_, index) => (
                <button 
                    key={index} 
                    onClick={() => offerApi?.scrollTo(index)} 
                    // Active: w-8 bg-primary, Inactive: w-2 bg-gray-300
                    className={`h-1.5 rounded-full transition-all duration-300 ${offerCurrent === index ? 'w-8 bg-primary' : 'w-2 bg-gray-300'}`} 
                />
              ))}
            </div>

          </div>
        </section>
      )}

      {/* 6. Bestsellers */}
       <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
             <h2 className="text-3xl font-bold font-headline mb-2">Customer Favorites ❤️</h2>
             <p className="text-muted-foreground">The most loved dishes from our kitchen.</p>
          </div>
          
          {bestsellers.length > 0 ? (
            <Carousel setApi={setBestsellerApi} opts={{ align: "start", loop: true }} className="w-full max-w-sm sm:max-w-xl md:max-w-3xl lg:max-w-6xl mx-auto">
              <CarouselContent>
                {bestsellers.map((product) => (
                  <CarouselItem key={product.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 pl-4">
                    <div className="p-1 h-full"><ProductCard product={product} /></div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          ) : (
            <p className="text-center text-muted-foreground">No products found.</p>
          )}

          {/* ★★★ Bestseller Dots (Kept as Ring Style) ★★★ */}
          {bestsellers.length > 0 && (
            <div className="flex justify-center gap-3 mt-8 items-center">
                {Array.from({ length: bestsellerCount }).map((_, index) => (
                    <button 
                        key={index} 
                        onClick={() => bestsellerApi?.scrollTo(index)} 
                        className={`rounded-full transition-all duration-300 ease-out 
                            ${bestsellerCurrent === index 
                                ? 'w-3 h-3 bg-primary ring-2 ring-offset-2 ring-primary scale-110' 
                                : 'w-2 h-2 bg-gray-300 hover:bg-gray-400' 
                            }`} 
                    />
                ))}
            </div>
          )}
          
          <div className="text-center mt-10">
              <Button asChild variant="outline" className="rounded-full px-8 border-primary/50 text-primary hover:bg-primary/5">
                  <Link href="/menus">View Full Menu</Link>
              </Button>
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="py-16 bg-slate-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12 font-headline">Happy Tummies 😊</h2>
            <Carousel plugins={[Autoplay({ delay: 4000 })]} opts={{ align: "start", loop: true }} className="w-full max-w-4xl mx-auto">
                <CarouselContent>
                    {testimonials.map((testimonial, index) => (
                        <CarouselItem key={index} className="md:basis-1/2 pl-4">
                            <Card className="border-none shadow-md bg-white h-full rounded-2xl">
                                <CardContent className="p-6 flex flex-col h-full">
                                    <div className="flex gap-1 mb-4"><Rating rating={testimonial.rating} className="" /></div>
                                    <p className="text-gray-600 italic flex-grow">"{testimonial.quote}"</p>
                                    <div className="mt-6 flex items-center gap-3">
                                        <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                                            {testimonial.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{testimonial.name}</p>
                                            <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
      </section>
      
      <MobileNav />
    </div>
  );
}