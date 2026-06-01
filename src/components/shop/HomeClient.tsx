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
import { Truck, ShieldCheck, Leaf, Gift, Cake, Heart, Sparkles, Percent, ChevronRight, ArrowLeft } from 'lucide-react';
import { SpecialDishCard } from './SpecialDishCard';
import { optimizeImageUrl } from '@/lib/imageUtils';

import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { Calendar } from "@/components/ui/calendar";
import { format, setMonth, setYear, getMonth, getYear, addMonths, subMonths } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence, PanInfo } from "framer-motion";

export type HeroSlide = { id: string; imageUrl: string; clickUrl: string; order?: number; };
export type Offer = { id: string; title: string; description: string; price: number; imageUrl: string; };
export type SliderImage = { id: string; imageUrl: string; clickUrl: string; order?: number; }; 

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

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => currentYear - i);

const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
};

function SwipeableCalendar({ 
    selected, onSelect, viewDate, setViewDate, onClose 
}: { 
    selected?: Date, onSelect: (date?: Date) => void, viewDate: Date, setViewDate: (date: Date) => void, onClose: () => void 
}) {
    const [direction, setDirection] = useState(0);

    const handleMonthChange = (newMonthIndex: number) => {
        const newDate = setMonth(viewDate, newMonthIndex);
        setDirection(newMonthIndex > getMonth(viewDate) ? 1 : -1);
        setViewDate(newDate);
    };

    const handleYearChange = (newYear: string) => {
        const newDate = setYear(viewDate, parseInt(newYear));
        setViewDate(newDate);
    };

    const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const swipeThreshold = 50;
        if (info.offset.x < -swipeThreshold) {
            setDirection(1);
            setViewDate(addMonths(viewDate, 1));
        } else if (info.offset.x > swipeThreshold) {
            setDirection(-1);
            setViewDate(subMonths(viewDate, 1));
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4 bg-white overflow-hidden w-full">
            <div className="flex gap-2 w-full max-w-xs z-20 relative">
                <Select value={months[getMonth(viewDate)]} onValueChange={(month) => handleMonthChange(months.indexOf(month))}>
                    <SelectTrigger className="w-[140px] h-10 border-amber-200 bg-amber-50/50 focus:ring-amber-500 rounded-lg">
                        <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map((month) => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={getYear(viewDate).toString()} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-[120px] h-10 border-amber-200 bg-amber-50/50 focus:ring-amber-500 rounded-lg">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <ScrollArea className="h-[200px]">
                            {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                        </ScrollArea>
                    </SelectContent>
                </Select>
            </div>

            <div className="relative w-full overflow-hidden min-h-[300px]">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={viewDate.toISOString()} custom={direction} variants={slideVariants}
                        initial="enter" animate="center" exit="exit"
                        transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={onDragEnd}
                        className="w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
                    >
                        <Calendar
                            mode="single" month={viewDate} onMonthChange={setViewDate}
                            selected={selected}
                            onSelect={(date) => { onSelect(date); onClose(); }}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus className="rounded-md border-0 w-full"
                            classNames={{
                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                month: "space-y-4 w-full",
                                caption: "hidden", nav: "hidden", 
                                table: "w-full border-collapse space-y-1 select-none",
                                head_row: "flex w-full justify-between",
                                head_cell: "text-muted-foreground rounded-md w-9 font-medium text-[0.8rem] h-9 flex items-center justify-center",
                                row: "flex w-full mt-2 justify-between",
                                cell: "h-10 w-10 text-center text-sm p-0 relative", 
                                day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-amber-100 rounded-xl transition-all data-[selected]:bg-amber-600 data-[selected]:text-white data-[selected]:shadow-lg",
                                day_today: "bg-amber-50 text-amber-900 font-bold border border-amber-200",
                                day_outside: "text-muted-foreground opacity-30",
                                day_disabled: "text-muted-foreground opacity-30",
                                day_hidden: "invisible",
                            }}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
            <p className="text-[10px] text-muted-foreground/60 -mt-2">Swipe left or right to change month</p>
        </div>
    );
}

export function HomeClient({ heroSlides, sliderImages, offers, bestsellers, allProducts = [] }: HomeClientProps) {
  const { user, login } = useAuth();
  
  const [homeData, setHomeData] = useState({
      heroSlides,
      sliderImages,
      offers,
      bestsellers,
      allProducts
  });

  useEffect(() => {
      const syncHomeData = async () => {
          const cachedData = localStorage.getItem('bumbas_home_data');
          const cachedVersion = localStorage.getItem('bumbas_home_version') || '0';
          
          if (cachedData) {
              try {
                  setHomeData(JSON.parse(cachedData));
              } catch (e) {
                  localStorage.removeItem('bumbas_home_data');
              }
          }

          try {
              const res = await fetch(`/api/home-data?v=${cachedVersion}`);
              const data = await res.json();

              if (data && !data.upToDate && data.data) {
                  setHomeData(data.data);
                  localStorage.setItem('bumbas_home_data', JSON.stringify(data.data));
                  localStorage.setItem('bumbas_home_version', data.version.toString());
              }
          } catch (e) {
              console.error("Home sync failed", e);
          }
      };

      syncHomeData();
  }, []);

  const [showDatePopup, setShowDatePopup] = useState(false);
  const [dob, setDob] = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [isSavingDates, setIsSavingDates] = useState(false);

  const [activeView, setActiveView] = useState<'main' | 'dob' | 'anniversary'>('main');
  const [dobViewDate, setDobViewDate] = useState<Date>(new Date("2000-01-01"));
  const [anniversaryViewDate, setAnniversaryViewDate] = useState<Date>(new Date());

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
  
  const dailySpecial = homeData.allProducts?.find((p: any) => p.isDailySpecial);

  const useCarouselEffect = (api: CarouselApi | undefined, setCount: (c: number) => void, setCurrent: (c: number) => void) => {
    useEffect(() => {
        if (!api) return;
        const updateState = () => { setCount(api.scrollSnapList().length); setCurrent(api.selectedScrollSnap()); };
        updateState();
        api.on("select", updateState);
        api.on("reInit", updateState);
        return () => { api.off("select", updateState); api.off("reInit", updateState); };
    }, [api, setCount, setCurrent]);
  };

  useCarouselEffect(heroApi, setHeroCount, setHeroCurrent);
  useCarouselEffect(middleApi, setMiddleCount, setMiddleCurrent);
  useCarouselEffect(offersApi, setOffersCount, setOffersCurrent);
  useCarouselEffect(bestsellersApi, setBestsellersCount, setBestsellersCurrent);

  useEffect(() => {
    if (user) {
        // @ts-ignore
        const missingDob = !user.dob; 
        // @ts-ignore
        const missingAnniversary = !user.anniversary;
        const hasSkipped = sessionStorage.getItem('skippedDatePopup');

        if ((missingDob || missingAnniversary) && !hasSkipped) {
            const timer = setTimeout(() => setShowDatePopup(true), 2000);
            return () => clearTimeout(timer);
        }
    }
  }, [user]);

  const handleSaveDates = async () => {
      try {
          setIsSavingDates(true);
          const nameParts = user?.name ? user.name.trim().split(' ') : ['User', ''];
          const firstName = nameParts || 'User';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '.'; 

          const res = await fetch('/api/auth/update-profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  firstName, lastName,
                  // @ts-ignore
                  dob: dob || user?.dob,
                  // @ts-ignore
                  anniversary: anniversary || user?.anniversary
              })
          });
          
          const data = await res.json();
          if (res.ok) {
              toast.success("Special dates saved successfully! 🎉");
              login(data.user); 
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
        {homeData.heroSlides.length > 0 ? (
          <>
            <Carousel setApi={setHeroApi} opts={{ loop: true }} plugins={[Autoplay({ delay: 5000 })]}>
              <CarouselContent>
                {homeData.heroSlides.map((slide: any) => (
                  <CarouselItem key={slide.id}>
                    {/* ★ FIX: prefetch={false} */}
                    <Link href={slide.clickUrl} prefetch={false} className="block w-full relative">
                      <Image 
                        src={optimizeImageUrl(slide.imageUrl)} alt="Hero Slide" width={0} height={0} sizes="100vw"
                        style={{ width: '100%', height: 'auto' }} className="object-contain" priority 
                      />
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {Array.from({ length: heroCount }).map((_, index) => (
                <button 
                    key={index} onClick={() => heroApi?.scrollTo(index)} 
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
                  {/* ★ FIX: prefetch={false} */}
                  <Button asChild size="lg" className="rounded-full"><Link href="/menus" prefetch={false}>Order Now</Link></Button>
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
                      // ★ FIX: prefetch={false}
                      <Link key={idx} href={cat.link} prefetch={false} className="flex flex-col items-center gap-2 min-w-[70px] group cursor-pointer">
                          <div className={`relative h-14 w-14 md:h-20 md:w-20 rounded-full border-[3px] ${cat.borderColor} p-0.5 shadow-md group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300 bg-white`}>
                              <div className="relative h-full w-full rounded-full overflow-hidden bg-white">
                                  <Image src={cat.image} alt={cat.name} fill sizes="(max-width: 768px) 20vw, 10vw" className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized={true} />
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
      {homeData.sliderImages && homeData.sliderImages.length > 0 && (
        <section className="py-8 bg-background">
          <div className="container">
            <Carousel setApi={setMiddleApi} opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 3500 })]} className="w-full">
                <CarouselContent>
                    {homeData.sliderImages.map((slide: any) => (
                    <CarouselItem key={slide.id} className="md:basis-1/2 lg:basis-1/3 pl-4">
                        <div className="p-1">
                        {/* ★ FIX: prefetch={false} */}
                        <Link href={slide.clickUrl || '#'} prefetch={false} className="block cursor-pointer hover:opacity-95 transition-opacity">
                            <Card className="overflow-hidden border-none shadow-md rounded-2xl bg-card">
                                <CardContent className="p-0">
                                <Image src={optimizeImageUrl(slide.imageUrl)} alt="Slider Image" width={0} height={0} sizes="(max-width: 768px) 90vw, 33vw" style={{ width: '100%', height: 'auto' }} className="object-contain" />
                                </CardContent>
                            </Card>
                        </Link>
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
            {middleCount > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                    {Array.from({ length: middleCount }).map((_, index) => (
                        <button key={index} onClick={() => middleApi?.scrollTo(index)} className={`h-1.5 rounded-full transition-all duration-300 ${middleCurrent === index ? 'w-6 bg-primary' : 'w-1.5 bg-primary/20'}`} aria-label={`Go to slide ${index + 1}`} />
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
                         {dailySpecial.images && dailySpecial.images.length > 0 && dailySpecial.images.url ? (
                            <Image src={optimizeImageUrl(dailySpecial.images.url)} alt={dailySpecial.name} fill sizes="(max-width: 768px) 90vw, 50vw" className="object-cover" />
                         ) : (
                             <SpecialDishCard name={dailySpecial.name} description={dailySpecial.description} price={dailySpecial.price} />
                         )}
                    </div>
                    <div className="mt-6 px-2 pb-2">
                        {/* ★ FIX: prefetch={false} */}
                        <Button asChild size="lg" className="w-full rounded-xl text-lg font-bold h-14 shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform">
                            <Link href={`/menus/${dailySpecial.slug}`} prefetch={false}>Order Now - {formatPrice(dailySpecial.price)}</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
      )}

      {/* 6. Upcoming Offers */}
      {homeData.offers.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold font-headline mb-2">Hot Offers 🔥</h2>
                <p className="text-muted-foreground">Grab the best deals before they are gone.</p>
            </div>
            <Carousel setApi={setOffersApi} opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent>
                    {homeData.offers.map((offer: any) => (
                    <CarouselItem key={offer.id} className="md:basis-1/2 lg:basis-1/3 pl-4">
                        <div className="p-1 h-full">
                        <Card className="overflow-hidden group h-full border-none shadow-md rounded-2xl bg-card hover:shadow-xl transition-shadow">
                            <CardContent className="p-0 relative">
                            <Image src={optimizeImageUrl(offer.imageUrl)} alt={offer.title} width={0} height={0} sizes="(max-width: 768px) 85vw, 33vw" style={{ width: '100%', height: 'auto' }} className="block" />
                            </CardContent>
                        </Card>
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
            {offersCount > 1 && (
                <div className="flex justify-center gap-1.5 mt-6">
                    {Array.from({ length: offersCount }).map((_, index) => (
                        <button key={index} onClick={() => offersApi?.scrollTo(index)} className={`h-1.5 rounded-full transition-all duration-300 ${offersCurrent === index ? 'w-6 bg-primary' : 'w-1.5 bg-primary/20'}`} aria-label={`Go to offer slide ${index + 1}`} />
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
          {homeData.bestsellers.length > 0 ? (
            <div className="w-full max-w-sm sm:max-w-xl md:max-w-3xl lg:max-w-6xl mx-auto">
                <Carousel setApi={setBestsellersApi} opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent>
                    {homeData.bestsellers.map((product: any) => (
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
                {bestsellersCount > 1 && (
                    <div className="flex justify-center gap-1.5 mt-8">
                        {Array.from({ length: bestsellersCount }).map((_, index) => (
                            <button key={index} onClick={() => bestsellersApi?.scrollTo(index)} className={`h-1.5 rounded-full transition-all duration-300 ${bestsellersCurrent === index ? 'w-6 bg-primary' : 'w-1.5 bg-primary/20'}`} aria-label={`Go to product slide ${index + 1}`} />
                        ))}
                    </div>
                )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No products found.</p>
          )}
          <div className="text-center mt-12">
              {/* ★ FIX: prefetch={false} */}
              <Button asChild variant="outline" className="rounded-full px-8 border-primary/50 text-primary hover:bg-primary/5">
                  <Link href="/menus" prefetch={false}>View Full Menu</Link>
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
                                            {testimonial.name}
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
      <Dialog 
        open={showDatePopup} 
        onOpenChange={(open) => { 
            if (!open) handleSkipPopup(); 
            if (!open) setActiveView('main');
        }}
      >
          <DialogContent className="w-[92%] max-w-sm rounded-[2rem] p-0 bg-white border-0 shadow-2xl overflow-hidden focus:outline-none">
              
              {activeView === 'main' && (
                  <>
                    <div className="relative bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 p-8 pb-10 text-center overflow-hidden">
                        <div className="absolute -top-6 -left-6 w-24 h-24 bg-pink-300/40 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 -right-6 w-32 h-32 bg-amber-300/40 rounded-full blur-2xl"></div>
                        
                        <div className="relative z-10 mx-auto w-20 h-20 bg-white/80 backdrop-blur-md text-amber-500 rounded-full flex items-center justify-center mb-4 shadow-xl border border-white/50">
                            <Gift className="w-10 h-10 drop-shadow-sm text-orange-500" />
                            <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-amber-400 animate-pulse" />
                        </div>
                        
                        <DialogTitle className="relative z-10 text-2xl font-black bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent drop-shadow-sm pb-1">
                            A Special Gift! 🎁
                        </DialogTitle>
                        <DialogDescription className="relative z-10 text-sm mt-2 text-gray-700 font-medium px-2 leading-relaxed">
                            Add your special dates and get a <span className="inline-flex items-center gap-1 font-black text-rose-600 bg-white/60 px-2 py-0.5 rounded-md shadow-sm border border-rose-100 mx-1"><Percent className="w-3.5 h-3.5"/> Flat 5% OFF</span> on your celebration days!
                        </DialogDescription>
                    </div>

                    <div className="relative z-20 bg-white rounded-t-[2rem] -mt-6 p-6 pt-8 space-y-5">
                        {/* @ts-ignore */}
                        {!user?.dob && (
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    <Cake className="h-5 w-5 text-pink-400 group-hover:text-pink-600 transition-colors" />
                                </div>
                                <div 
                                    onClick={() => setActiveView('dob')}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-700 cursor-pointer flex items-center justify-between hover:bg-white hover:border-pink-400 transition-all"
                                >
                                    <span className={dob ? "text-gray-900" : "text-gray-400"}>
                                        {dob ? format(new Date(dob), "MMMM do, yyyy") : "Select Birthday"}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-gray-300" />
                                </div>
                                <label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold uppercase tracking-widest text-pink-500 rounded-full border border-pink-100 shadow-sm z-10">
                                    Your Birthday
                                </label>
                            </div>
                        )}
                        
                        {/* @ts-ignore */}
                        {!user?.anniversary && (
                            <div className="relative group mt-2">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    <Heart className="h-5 w-5 text-red-400 group-hover:text-red-600 transition-colors" />
                                </div>
                                <div 
                                    onClick={() => setActiveView('anniversary')}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-700 cursor-pointer flex items-center justify-between hover:bg-white hover:border-red-400 transition-all"
                                >
                                    <span className={anniversary ? "text-gray-900" : "text-gray-400"}>
                                        {anniversary ? format(new Date(anniversary), "MMMM do, yyyy") : "Select Anniversary"}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-gray-300" />
                                </div>
                                <label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold uppercase tracking-widest text-red-500 rounded-full border border-red-100 shadow-sm z-10">
                                    Anniversary <span className="opacity-60 lowercase">(optional)</span>
                                </label>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 mt-8">
                            <Button 
                                className="w-full rounded-2xl h-14 text-[15px] font-black tracking-wide uppercase bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.02] hover:-translate-y-0.5" 
                                onClick={handleSaveDates} 
                                disabled={isSavingDates || (!dob && !anniversary)}
                            >
                                {isSavingDates ? (
                                    <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</span>
                                ) : (
                                    <span className="flex items-center gap-2">Claim 5% Discount <Sparkles className="w-4 h-4" /></span>
                                )}
                            </Button>
                            <button 
                                className="w-full h-10 text-gray-400 hover:text-gray-600 text-sm font-semibold transition-colors focus:outline-none" 
                                onClick={handleSkipPopup}
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                  </>
              )}

              {activeView === 'dob' && (
                  <div className="flex flex-col h-full bg-white animate-in slide-in-from-right-8 duration-300">
                      <div className="flex items-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                          <button onClick={() => setActiveView('main')} className="p-2 hover:bg-white/60 rounded-full transition-colors">
                              <ArrowLeft className="w-5 h-5 text-amber-800" />
                          </button>
                          <h3 className="flex-1 text-center font-bold text-amber-900 pr-9 text-lg">Select Birthday 🎂</h3>
                      </div>
                      <SwipeableCalendar 
                          viewDate={dobViewDate} 
                          setViewDate={setDobViewDate} 
                          selected={dob ? new Date(dob) : undefined} 
                          onSelect={(d: any) => {
                              setDob(d ? format(d, "yyyy-MM-dd") : "");
                              setActiveView('main');
                          }} 
                          onClose={() => setActiveView('main')} 
                      />
                  </div>
              )}

              {activeView === 'anniversary' && (
                  <div className="flex flex-col h-full bg-white animate-in slide-in-from-right-8 duration-300">
                      <div className="flex items-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                          <button onClick={() => setActiveView('main')} className="p-2 hover:bg-white/60 rounded-full transition-colors">
                              <ArrowLeft className="w-5 h-5 text-amber-800" />
                          </button>
                          <h3 className="flex-1 text-center font-bold text-amber-900 pr-9 text-lg">Select Anniversary ❤️</h3>
                      </div>
                      <SwipeableCalendar 
                          viewDate={anniversaryViewDate} 
                          setViewDate={setAnniversaryViewDate} 
                          selected={anniversary ? new Date(anniversary) : undefined} 
                          onSelect={(d: any) => {
                              setAnniversary(d ? format(d, "yyyy-MM-dd") : "");
                              setActiveView('main');
                          }} 
                          onClose={() => setActiveView('main')} 
                      />
                  </div>
              )}

          </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
}