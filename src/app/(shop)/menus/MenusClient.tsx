// src/app/(shop)/menus/MenusClient.tsx

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ProductCard } from '@/components/shop/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, SlidersHorizontal, X, 
  UtensilsCrossed, ArrowUpDown, Leaf, Loader2
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { optimizeImageUrl } from '@/lib/imageUtils';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';

const CATEGORIES = [
    { name: "All", image: "/Categories/9.webp" }, 
    { name: "Chicken", image: "/Categories/7.webp" },
    { name: "Mutton", image: "/Categories/4.webp" },
    { name: "Rice", image: "/Categories/2.webp" },    
    { name: "Fish", image: "/Categories/3.webp" },
    { name: "Paneer", image: "/Categories/8.webp" },
    { name: "Fried", image: "/Categories/5.webp" },
    { name: "Chapati", image: "/Categories/6.webp" },
    { name: "Veg", image: "/Categories/1.webp" },
];

type MenusClientProps = {
  initialProducts: Product[];
};

export function MenusClient({ initialProducts }: MenusClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Map<string, HTMLButtonElement> | null>(null);
  if (!itemsRef.current) itemsRef.current = new Map();
  
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempSortBy, setTempSortBy] = useState('recommended');
  const [tempShowVegOnly, setTempShowVegOnly] = useState(false);

  // Load All Products for Client-side Search
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?limit=1000`);
        const data = await res.json();
        if (data.success) {
          setAllProducts(data.products);
        }
      } catch (e) {
        console.error("Error loading products", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Prothom bar load hobe
    fetchAll();

    // 🌟 Pusher theke update asle automatic abar load hobe
    const handleRealtimeUpdate = () => {
      console.log("Syncing new menu data...");
      fetchAll();
    };

    window.addEventListener('menu-updated', handleRealtimeUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('menu-updated', handleRealtimeUpdate);
    };
  }, []);

  // Fuse.js Fuzzy Filtering Logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...allProducts];

    if (activeCategory !== 'All') {
      result = result.filter(p => p.category.name.toLowerCase() === activeCategory.toLowerCase());
    }

    if (showVegOnly) {
      result = result.filter(p => 
        p.name.toLowerCase().includes('veg') || 
        p.category.name.toLowerCase() === 'veg' || 
        p.category.name.toLowerCase() === 'paneer'
      );
    }

    if (searchQuery.trim().length > 0) {
      const fuse = new Fuse(result, {
        keys: ['name', 'category.name', 'description'],
        threshold: 0.3,
        distance: 100
      });
      result = fuse.search(searchQuery).map(r => r.item);
    }

    switch (sortBy) {
      case 'price-low': result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      default: break; 
    }

    return result;
  }, [allProducts, activeCategory, searchQuery, showVegOnly, sortBy]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
        const matched = CATEGORIES.find(c => c.name.toLowerCase() === categoryFromUrl.toLowerCase());
        if (matched) setActiveCategory(matched.name);
    } else {
        setActiveCategory('All');
    }
  }, [searchParams]);

  useEffect(() => {
    const container = categoryContainerRef.current;
    const selectedItem = itemsRef.current?.get(activeCategory);
    if (container && selectedItem) {
        const scrollPosition = selectedItem.offsetLeft - (container.offsetWidth / 2) + (selectedItem.offsetWidth / 2);
        container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [activeCategory]);

  const handleApplyFilters = () => {
      setSortBy(tempSortBy);
      setShowVegOnly(tempShowVegOnly);
      setIsFilterOpen(false); 
  };

    // ★ আগের কোডটা ডিলিট করে এটা বসান ★
  const handleCategoryChange = (category: string) => {
      // ১. ক্লিক করা মাত্রই ইনস্ট্যান্ট UI আপডেট (কোনো ডিলে নেই)
      setActiveCategory(category);
      
      // ২. সাইলেন্টলি URL আপডেট (Next.js রাউটারকে বাইপাস করে)
      const newUrl = category === 'All' ? '/menus' : `/menus?category=${category.toLowerCase()}`;
      window.history.pushState(null, '', newUrl);
  };


  return (
    <div className="min-h-screen bg-gray-50/50">
      
      {/* HEADER & FILTERS */}
      <div className={cn("sticky top-[60px] z-30 bg-background transition-all duration-300 border-b", isScrolled ? "shadow-md py-2" : "pt-3 pb-0")}>
          <div className="container space-y-2"> 
              <div className="flex gap-3 items-center">
                  <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                          placeholder="Search for dishes..." 
                          className="pl-10 bg-muted/30 border-muted-foreground/20 rounded-xl h-11 focus:bg-background transition-all"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {searchQuery && (
                              <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground p-1">
                                  <X className="h-4 w-4" />
                              </button>
                          )}
                      </div>
                  </div>
                  
                  {/* Mobile Filter */}
                  <div className="md:hidden">
                      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-muted-foreground/20">
                                <SlidersHorizontal className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-3xl">
                            <SheetHeader className="text-left mb-6">
                                <SheetTitle>Filters & Sort</SheetTitle>
                                <SheetDescription>Customize your menu view.</SheetDescription>
                            </SheetHeader>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium flex items-center gap-2"><Leaf className="h-4 w-4 text-green-600"/> Veg Only</span>
                                    <div 
                                        className={cn("w-12 h-6 rounded-full p-1 cursor-pointer transition-colors", tempShowVegOnly ? "bg-green-500" : "bg-muted")}
                                        onClick={() => setTempShowVegOnly(!tempShowVegOnly)}
                                    >
                                        <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-transform", tempShowVegOnly ? "translate-x-6" : "translate-x-0")} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="font-medium">Sort By</span>
                                    <Select value={tempSortBy} onValueChange={setTempSortBy}>
                                        <SelectTrigger className="w-full h-12 rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="recommended">Recommended</SelectItem>
                                            <SelectItem value="rating">Top Rated</SelectItem>
                                            <SelectItem value="price-low">Price: Low to High</SelectItem>
                                            <SelectItem value="price-high">Price: High to Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="w-full h-12 rounded-xl text-lg" onClick={handleApplyFilters}>
                                    Apply Filters
                                </Button>
                            </div>
                        </SheetContent>
                      </Sheet>
                  </div>

                  {/* Desktop Filters */}
                  <div className="hidden md:flex gap-3 items-center">
                      <div 
                        className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all select-none", showVegOnly ? "bg-green-50 border-green-200 text-green-700" : "bg-background border-border hover:bg-muted")}
                        onClick={() => setShowVegOnly(!showVegOnly)}
                      >
                          <Leaf className={cn("h-4 w-4", showVegOnly && "fill-current")} />
                          <span className="font-medium text-sm">Veg Only</span>
                      </div>

                      <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-[160px] h-11 rounded-xl border-muted-foreground/20">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                  <ArrowUpDown className="h-4 w-4" />
                                  <span className="text-foreground"><SelectValue /></span>
                              </div>
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="recommended">Recommended</SelectItem>
                              <SelectItem value="rating">Top Rated</SelectItem>
                              <SelectItem value="price-low">Price: Low to High</SelectItem>
                              <SelectItem value="price-high">Price: High to Low</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>

              {/* Category Slider */}
              <div ref={categoryContainerRef} className="flex gap-2 md:gap-4 overflow-x-auto pb-1 pt-1 scrollbar-hide mask-fade-right">
                  {CATEGORIES.map((cat, idx) => {
                      const isActive = activeCategory === cat.name;
                      return (
                          <button
                              key={idx}
                              ref={(el) => { if (el) itemsRef.current?.set(cat.name, el); }}
                              onClick={() => handleCategoryChange(cat.name)}
                              className={cn(
                                  "flex flex-col items-center gap-1.5 min-w-[70px] group transition-all duration-300 p-1 rounded-xl",
                                  isActive ? "scale-105" : "hover:bg-muted/50"
                              )}
                          >
                              <div className={cn(
                                  "relative h-12 w-12 rounded-full overflow-hidden border-2 transition-all",
                                  isActive ? "border-primary shadow-md ring-2 ring-primary/20" : "border-transparent group-hover:border-muted-foreground/30"
                              )}>
                                  <Image 
                                    src={optimizeImageUrl(cat.image)} 
                                    alt={cat.name} 
                                    fill 
                                    className="object-cover" 
                                    unoptimized={true}
                                    loading="lazy" 
                                  />
                              </div>
                              <span className={cn("text-xs font-bold transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
                                  {cat.name}
                              </span>
                          </button>
                      )
                  })}
              </div>
          </div>
      </div>

      {/* --- PRODUCTS GRID --- */}
      <div className="container pt-2 pb-8 min-h-[60vh]">
        {isLoading && allProducts.length === 0 ? (
             <div className="flex justify-center py-20">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        ) : filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {filteredAndSortedProducts.map((product) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, margin: "-50px" }} // 🌟 CHANGED: once: false kora hoyeche jate bar bar scroll e animation hoy
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <ProductCard product={product} />
                    </motion.div>
                ))}
            </div>
        ) : (
            // No items state
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in zoom-in duration-300">
                <div className="h-40 w-40 bg-muted/30 rounded-full flex items-center justify-center relative">
                    <UtensilsCrossed className="h-16 w-16 text-muted-foreground/30" />
                    <Search className="h-8 w-8 text-primary absolute bottom-8 right-8 bg-white rounded-full p-1 shadow-md" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">No items found!</h2>
                    <p className="text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
                        We couldn't find any dishes matching "{searchQuery}". Try changing the category or search term.
                    </p>
                </div>
                <Button 
                    onClick={() => { setActiveCategory('All'); setSearchQuery(''); setShowVegOnly(false); router.push('/menus'); }} 
                    className="rounded-full px-8 shadow-lg shadow-primary/20"
                >
                    Clear All Filters
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}