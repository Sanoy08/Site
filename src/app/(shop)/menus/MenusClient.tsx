// src/app/(shop)/menus/MenusClient.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  
  // Refs
  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Map<string, HTMLButtonElement> | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  if (!itemsRef.current) itemsRef.current = new Map();
  
  // States
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Pagination States
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // AI Search States
  const [aiSearchResults, setAiSearchResults] = useState<Product[] | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);

  // Filter Sheet States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempSortBy, setTempSortBy] = useState('recommended');
  const [tempShowVegOnly, setTempShowVegOnly] = useState(false);

  // Scroll Detection
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Footer Hiding Logic
  useEffect(() => {
    const footer = document.querySelector('footer');
    const shouldHideFooter = hasMore || (searchQuery.length >= 3 && isAiSearching);
    
    if (footer) {
        footer.style.display = shouldHideFooter ? 'none' : '';
    }
    return () => {
        if (footer) footer.style.display = '';
    };
  }, [hasMore, searchQuery, isAiSearching]);

  // URL Sync
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (categoryFromUrl) {
        const matched = CATEGORIES.find(c => c.name.toLowerCase() === categoryFromUrl.toLowerCase());
        if (matched) setActiveCategory(matched.name);
    } else {
        setActiveCategory('All');
    }
  }, [searchParams]);

  // Auto Scroll Category Button
  useEffect(() => {
    const container = categoryContainerRef.current;
    const selectedItem = itemsRef.current?.get(activeCategory);
    if (container && selectedItem) {
        const scrollPosition = selectedItem.offsetLeft - (container.offsetWidth / 2) + (selectedItem.offsetWidth / 2);
        container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [activeCategory]);

  // ★★★ AI Search Logic (Fixed) ★★★
  useEffect(() => {
      // যদি ৩ অক্ষরের কম হয়
      if (searchQuery.length < 3) {
          setAiSearchResults(null);
          setIsAiSearching(false); // ★ FIX: লোডার বন্ধ করার জন্য এই লাইনটি যোগ করা হয়েছে
          return;
      }

      setIsAiSearching(true);
      const timeoutId = setTimeout(async () => {
          try {
              const res = await fetch(`/api/search?q=${searchQuery}`);
              const data = await res.json();
              if (data.success) {
                  setAiSearchResults(data.products);
              }
          } catch (error) {
              console.error("Search error:", error);
          } finally {
              setIsAiSearching(false);
          }
      }, 500);

      return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Data Fetching Function
  const fetchProducts = useCallback(async (reset = false) => {
    if (searchQuery.length >= 3) return;

    setIsLoading(true);
    const nextPage = reset ? 1 : page + 1;
    
    try {
        const queryParams = new URLSearchParams({
            page: nextPage.toString(),
            limit: '12',
            category: activeCategory,
            sort: sortBy,
            vegOnly: showVegOnly.toString(),
            search: searchQuery
        });

        const res = await fetch(`/api/products?${queryParams}`);
        const data = await res.json();

        if (data.success) {
            if (reset) {
                setProducts(data.products);
            } else {
                setProducts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNewProducts = data.products.filter((p: Product) => !existingIds.has(p.id));
                    return [...prev, ...uniqueNewProducts];
                });
            }
            setHasMore(data.hasMore);
            setPage(nextPage);
        }
    } catch (error) {
        console.error("Failed to load products", error);
    } finally {
        setIsLoading(false);
    }
  }, [activeCategory, sortBy, showVegOnly, searchQuery, page]);

  // Filter Change Effect
  useEffect(() => {
      if (isInitialLoad) {
          setIsInitialLoad(false);
          return;
      }
      if (searchQuery.length < 3) {
          fetchProducts(true);
      }
  }, [activeCategory, sortBy, showVegOnly, searchQuery]);

  // Infinite Scroll Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && searchQuery.length < 3) {
          fetchProducts(false);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoading, fetchProducts, searchQuery]);

  const handleApplyFilters = () => {
      setSortBy(tempSortBy);
      setShowVegOnly(tempShowVegOnly);
      setIsFilterOpen(false); 
  };

  const handleCategoryChange = (category: string) => {
      if (category === 'All') router.push('/menus');
      else router.push(`/menus?category=${category.toLowerCase()}`);
  };

  // Display Logic
  const displayProducts = (searchQuery.length >= 3 && aiSearchResults) ? aiSearchResults : products;
  const isDisplayLoading = isLoading || (searchQuery.length >= 3 && isAiSearching);

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
                          {isAiSearching ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : searchQuery ? (
                              <button onClick={() => { setSearchQuery(''); setAiSearchResults(null); setIsAiSearching(false); }} className="text-muted-foreground hover:text-foreground p-1">
                                  <X className="h-4 w-4" />
                              </button>
                          ) : null}
                      </div>
                  </div>
                  
                  {/* Mobile Filter Sheet */}
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
                                    alt={cat.name} fill className="object-cover" unoptimized={true}
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
        {displayProducts.length > 0 ? (
            <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards">
                    {displayProducts.map((product) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, margin: "-10%" }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </div>
                
                {/* Infinite Scroll Trigger - শুধু নরমাল মোডে দেখাবে, AI সার্চে নয় */}
                {hasMore && searchQuery.length < 3 && (
                    <div 
                        ref={observerTarget} 
                        className="flex justify-center items-center py-8"
                    >
                        <div className="flex flex-col items-center gap-2 text-muted-foreground animate-pulse">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-xs font-medium">Loading deliciousness...</span>
                        </div>
                    </div>
                )}
            </>
        ) : (
            // No Products State
            !isDisplayLoading && (
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
                        onClick={() => { setActiveCategory('All'); setSearchQuery(''); setShowVegOnly(false); setAiSearchResults(null); setIsAiSearching(false); router.push('/menus'); }} 
                        className="rounded-full px-8 shadow-lg shadow-primary/20"
                    >
                        Clear All Filters
                    </Button>
                </div>
            )
        )}
        
        {/* Loading State when list is empty */}
        {isDisplayLoading && displayProducts.length === 0 && (
             <div className="flex justify-center py-20">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        )}
      </div>
    </div>
  );
}