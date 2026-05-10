// src/components/shop/HomeClient.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import type { Product } from '@/lib/types';
import { Utensils, Truck, ShieldCheck, Leaf, Gift, CalendarHeart } from 'lucide-react';
import { SpecialDishCard } from './SpecialDishCard';
import { optimizeImageUrl } from '@/lib/imageUtils';

// ★★★ NEW IMPORTS FOR POPUP ★★★
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export type HeroSlide = { id: string; imageUrl: string; clickUrl: string; };
export type Offer = { id: string; title: string; description: string; price: number; imageUrl: string; };
export type SliderImage = { id: string; imageUrl: string; clickUrl: string; }; 

type HomeClientProps = { 
  heroSlides: HeroSlide[]; 
  sliderImages: SliderImage[];
  offers: Offer[]; 
  bestsellers: Product[]; 
  allProducts?: Product[]; 
};

const CATEGORIES = [
    { name: "All", image: "/Categories/9.webp", link: "/menus", borderColor: "border-slate-500" },
    { name: "Chicken", image: "/Categories/7.webp", link: "/menus?category=chicken", borderColor: "border-red-500" },
    { name: "Mutton", image: "/Categories/4.webp", link: "/menus?category=mutton", borderColor: "border-amber-700" },
    { name: "Rice", image: "/Categories/2.webp", link: "/menus?category=rice", borderColor: "border-orange-400" },    
    { name: "Fish", image: "/Categories/3.webp", link: "/menus?category=fish", borderColor: "border-cyan-500" },
    { name: "Paneer", image: "/Categories/8.webp", link: "/menus?category=paneer", borderColor: "border-indigo-500" },
    { name: "Fried", image: "/Categories/5.webp", link: "/menus?category=fried", borderColor: "border-emerald-500" },
    { name: "Chapati", image: "/Categories/6.webp", link: "/menus?category=chapati", borderColor: "border-yellow-600" },
    { name: "Veg", image: "/Categories/1.webp", link: "/menus?category=veg", borderColor: "border-lime-500" },
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

export function HomeClient({ heroSlides, sliderImages, offers, bestsellers, allProducts = [] }: HomeClientProps) {
  // ★★★ AUTH & POPUP STATES ★★★
  const { user, login } = useAuth();
  const [showDatePopup, setShowDatePopup] = useState(false);
  const [dob, setDob] = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [isSavingDates, setIsSavingDates] = useState(false);

  // Carousel States
  const [heroApi, setHeroApi] = useState<CarouselApi>()
  const [heroCurrent, setHeroCurrent] = useState(0)
  const [heroCount, setHeroCount] = useState(0)

  const [middleApi, setMiddleApi] = useState<CarouselApi>()
  const [middleCurrent, setMiddleCurrent] = useState(0)
  const [middleCount, setMiddleCount] = useState(0)

  const [offersApi, setOffersApi] = useState<CarouselApi>()
  const [offersCurrent, setOffersCurrent] = useState(0)
  const [offersCount, setOffersCount] = useState(0)

  const [bestsellersApi, setBestsellersApi] = useState<CarouselApi>()
  const [bestsellersCurrent, setBestsellersCurrent] = useState(0)
  const [bestsellersCount, setBestsellersCount] = useState(0)
  
  const dailySpecial = allProducts.find(p => p.isDailySpecial);

  // Helper Hook to handle carousel state updates
  const useCarouselEffect = (api: CarouselApi | undefined, setCount: (c: number) => void, setCurrent: (c: number) => void) => {
    useEffect(() => {
        if (!api) return;
        
        const updateState = () => {
            setCount(api.scrollSnapList().length);
            setCurrent(api.selectedScrollSnap());
        };

        updateState();
        api.on("select", updateState);
        api.on("reInit", updateState);

        return () => {
            api.off("select", updateState);
            api.off("reInit", updateState);
        };
    }, [api, setCount, setCurrent]);
  };

  useCarouselEffect(heroApi, setHeroCount, setHeroCurrent);
  useCarouselEffect(middleApi, setMiddleCount, setMiddleCurrent);
  useCarouselEffect(offersApi, setOffersCount, setOffersCurrent);
  useCarouselEffect(bestsellersApi, setBestsellersCount, setBestsellersCurrent);

  // ★★★ POPUP LOGIC EFFECT ★★★
  useEffect(() => {
    if (user) {
        // @ts-ignore (ignore type warning if dob is strictly not defined in type yet)
        const missingDob = !user.dob; 
        // @ts-ignore
        const missingAnniversary = !user.anniversary;
        
        const hasSkipped = sessionStorage.getItem('skippedDatePopup');

        // যদি DOB বা Anniversary ফাঁকা থাকে এবং ইউজার সেশনে এটি স্কিপ না করে থাকে
        if ((missingDob || missingAnniversary) && !hasSkipped) {
            // ২ সেকেন্ড পর পপআপ আসবে যাতে ইউজার একটু পেজটা দেখতে পারে
            const timer = setTimeout(() => setShowDatePopup(true), 2000);
            return () => clearTimeout(timer);
        }
    }
  }, [user]);

  // ★★★ SAVE DATES HANDLER ★★★
  const handleSaveDates = async () => {
      try {
          setIsSavingDates(true);
          
          // API এর requirement অনুযায়ী first & last name split করা হচ্ছে
          const nameParts = user?.name ? user.name.trim().split(' ') : ['User', ''];
          const firstName = nameParts[0] || 'User';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '.'; // fallback for single names

          const res = await fetch('/api/auth/update-profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  firstName,
                  lastName,
                  // @ts-ignore
                  dob: dob || user?.dob,
                  // @ts-ignore
                  anniversary: anniversary || user?.anniversary
              })
          });
          
          const data = await res.json();
          if (res.ok) {
              toast.success("Special dates saved! 🎉");
              login(data.user); // State Update without API Fetch
              setShowDatePopup(false);
          } else {
              toast.error(data.error || "Failed to save");
          }
      } catch (e) {
          toast.error("An error occurred");
      } finally {
          setIsSavingDates(false);
      }
  };

  const handleSkipPopup = () => {
      sessionStorage.setItem('skippedDatePopup', 'true');
      setShowDatePopup(false);
  };

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
                        src={optimizeImageUrl(slide.imageUrl)} 
                        alt="Hero Slide" 
                        width={0}
                        height={0}
                        sizes="100vw"
                        style={{ width: '100%', height: 'auto' }}
                        className="object-contain" 
                        priority 
                      />
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            
            {/* Hero Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {Array.from({ length: heroCount }).map((_, index) => (
                <button 
                    key={index} 
                    onClick={() => heroApi?.scrollTo(index)} 
                    className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${heroCurrent === index ? 'w-8 bg-white' : 'w-2 bg-white/60'}`} 
                    aria-label={`Go to slide ${index + 1}`}
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
              <div className="text-center mb-8">
                 <h2 className="text-3xl font-bold font-headline mb-2">What's on your mind? 😋</h2>
                 <p className="text-muted-foreground">Explore our wide range of categories.</p>
              </div>
              
              <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide md:justify-center">
                  {CATEGORIES.map((cat, idx) => (
                      <Link key={idx} href={cat.link} className="flex flex-col items-center gap-2 min-w-[70px] group cursor-pointer">
                          <div className={`relative h-14 w-14 md:h-20 md:w-20 rounded-full border-[3px] ${cat.borderColor} p-0.5 shadow-md group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300 bg-white`}>
                              <div className="relative h-full w-full rounded-full overflow-hidden bg-white">
                                  <Image 
                                    src={cat.image} 
                                    alt={cat.name} 
                                    fill 
                                    sizes="(max-width: 768px) 20vw, 10vw"
                                    className="object-cover group-hover:scale-110 transition-transform duration-500" 
                                    unoptimized={true}
                                  />
                              </div>
                          </div>
                          <span className="text-xs md:text-sm font-semibold text-gray-700 group-hover:text-primary transition-colors">{cat.name}</span>
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

      {/* 4. Middle Image Slider Section */}
      {sliderImages && sliderImages.length > 0 && (
        <section className="py-8 bg-background">
          <div className="container">
            <Carousel setApi={setMiddleApi} opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 3500 })]} className="w-full">
                <CarouselContent>
                    {sliderImages.map((slide) => (
                    <CarouselItem key={slide.id} className="md:basis-1/2 lg:basis-1/3 pl-4">
                        <div className="p-1">
                        <Link href={slide.clickUrl || '#'} className="block cursor-pointer hover:opacity-95 transition-opacity">
                            <Card className="overflow-hidden border-none shadow-md rounded-2xl bg-card">
                                <CardContent className="p-0">
                                <Image 
                                    src={optimizeImageUrl(slide.imageUrl)} 
                                    alt="Slider Image" 
                                    width={0} 
                                    height={0}
                                    sizes="(max-width: 768px) 90vw, 33vw"
                                    style={{ width: '100%', height: 'auto' }}
                                    className="object-contain"
                                />
                                </CardContent>
                            </Card>
                        </Link>
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* Middle Slider Dots */}
            {middleCount > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                    {Array.from({ length: middleCount }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => middleApi?.scrollTo(index)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                middleCurrent === index ? 'w-6 bg-primary' : 'w-1.5 bg-primary/20'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
          </div>
        </section>
      )}

      {/* 5. Daily Special Section */}
      {dailySpecial && (
        <section className="py-16 bg-amber-50/50">
            <div className="container">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-headline mb-2">Today's Special 🌟</h2>
                    <p className="text-muted-foreground">Freshly prepared just for you.</p>
                </div>

                <div className="max-w-md mx-auto bg-white p-4 rounded-3xl shadow-xl border border-amber-100 hover:shadow-2xl transition-shadow duration-300">
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-sm bg-muted">
                         {dailySpecial.images && dailySpecial.images.length > 0 && dailySpecial.images[0].url ? (
                            <Image 
                                src={optimizeImageUrl(dailySpecial.images[0].url)}
                                alt={dailySpecial.name}
                                fill
                                sizes="(max-width: 768px) 90vw, 50vw"
                                className="object-cover"
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

      {/* 6. Upcoming Offers */}
      {offers.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold font-headline mb-2">Hot Offers 🔥</h2>
                <p className="text-muted-foreground">Grab the best deals before they are gone.</p>
            </div>
            
            <Carousel setApi={setOffersApi} opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent>
                    {offers.map((offer) => (
                    <CarouselItem key={offer.id} className="md:basis-1/2 lg:basis-1/3 pl-4">
                        <div className="p-1 h-full">
                        <Card className="overflow-hidden group h-full border-none shadow-md rounded-2xl bg-card hover:shadow-xl transition-shadow">
                            <CardContent className="p-0 relative">
                            <Image 
                                src={optimizeImageUrl(offer.imageUrl)} 
                                alt={offer.title} 
                                width={0}
                                height={0}
                                sizes="(max-width: 768px) 85vw, 33vw"
                                style={{ width: '100%', height: 'auto' }}
                                className="block"
                            />
                            </CardContent>
                        </Card>
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* Offers Dots */}
            {offersCount > 1 && (
                <div className="flex justify-center gap-1.5 mt-6">
                    {Array.from({ length: offersCount }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => offersApi?.scrollTo(index)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                offersCurrent === index ? 'w-6 bg-primary' : 'w-1.5 bg-primary/20'
                            }`}
                            aria-label={`Go to offer slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
          </div>
        </section>
      )}

      {/* 7. Bestsellers */}
       <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
             <h2 className="text-3xl font-bold font-headline mb-2">Customer Favorites ❤️</h2>
             <p className="text-muted-foreground">The most loved dishes from our kitchen.</p>
          </div>
          
          {bestsellers.length > 0 ? (
            <div className="w-full max-w-sm sm:max-w-xl md:max-w-3xl lg:max-w-6xl mx-auto">
                <Carousel setApi={setBestsellersApi} opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent>
                    {bestsellers.map((product) => (
                    <CarouselItem key={product.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 pl-4">
                        <div className="p-1 h-full">
                            <ProductCard product={product} />
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
                </Carousel>

                {/* Bestsellers Dots */}
                {bestsellersCount > 1 && (
                    <div className="flex justify-center gap-1.5 mt-8">
                        {Array.from({ length: bestsellersCount }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => bestsellersApi?.scrollTo(index)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    bestsellersCurrent === index ? 'w-6 bg-primary' : 'w-1.5 bg-primary/20'
                                }`}
                                aria-label={`Go to product slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No products found.</p>
          )}
          
          <div className="text-center mt-12">
              <Button asChild variant="outline" className="rounded-full px-8 border-primary/50 text-primary hover:bg-primary/5">
                  <Link href="/menus">View Full Menu</Link>
              </Button>
          </div>
        </div>
      </section>

      {/* 8. Testimonials */}
      <section className="py-16 bg-slate-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-headline mb-2">Happy Tummies 😊</h2>
            <p className="text-muted-foreground">What our customers say about us.</p>
          </div>
          
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
      
      {/* ★★★ SPECIAL DATES POPUP DIALOG ★★★ */}
      <Dialog open={showDatePopup} onOpenChange={(open) => { if (!open) handleSkipPopup(); }}>
          <DialogContent className="w-[90%] max-w-sm rounded-3xl p-6 bg-white border-0 shadow-2xl">
              <DialogHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-3 shadow-inner">
                      <Gift className="w-8 h-8" />
                  </div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                      Surprise Awaits! 🎁
                  </DialogTitle>
                  <DialogDescription className="text-sm mt-1 text-gray-500">
                      Save your special dates to get exclusive discounts on your celebrations!
                  </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 mt-2">
                  {/* @ts-ignore */}
                  {!user?.dob && (
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                              <CalendarHeart className="w-3.5 h-3.5 text-pink-500" /> Birthday
                          </label>
                          <input
                              type="date"
                              value={dob}
                              onChange={(e) => setDob(e.target.value)}
                              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-primary text-sm text-gray-800 transition-colors focus:bg-white"
                          />
                      </div>
                  )}
                  {/* @ts-ignore */}
                  {!user?.anniversary && (
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                              <CalendarHeart className="w-3.5 h-3.5 text-red-500" /> Anniversary <span className="text-[10px] text-gray-400 font-normal lowercase">(optional)</span>
                          </label>
                          <input
                              type="date"
                              value={anniversary}
                              onChange={(e) => setAnniversary(e.target.value)}
                              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-primary text-sm text-gray-800 transition-colors focus:bg-white"
                          />
                      </div>
                  )}
              </div>

              <div className="flex flex-col gap-2 mt-4">
                  <Button 
                      className="w-full rounded-xl h-12 text-base font-bold shadow-lg shadow-primary/20" 
                      onClick={handleSaveDates} 
                      disabled={isSavingDates || (!dob && !anniversary)}
                  >
                      {isSavingDates ? "Saving..." : "Save Special Dates"}
                  </Button>
                  <Button 
                      variant="ghost" 
                      className="w-full rounded-xl h-10 text-gray-400 hover:text-gray-600 text-sm" 
                      onClick={handleSkipPopup}
                  >
                      Maybe Later
                  </Button>
              </div>
          </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
}