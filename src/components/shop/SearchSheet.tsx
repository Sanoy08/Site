// src/components/shop/SearchSheet.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, X, Clock, TrendingUp, ChevronRight, 
  Loader2 
} from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import Image from 'next/image';
import { PLACEHOLDER_IMAGE_URL } from '@/lib/constants';
import { registerBackHandler } from '@/hooks/use-back-button';

// ✅ আমাদের ইমেজ অপটিমাইজার ইমপোর্ট
import { optimizeImageUrl } from '@/lib/imageUtils';

interface SearchSheetProps {
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TRENDING_TAGS = ['Chicken Biryani', 'Chicken Kosha', 'Fried Rice', 'Paneer', 'Thali'];

export function SearchSheet({ children, open, onOpenChange }: SearchSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  // ১. অটোমেটিক শিট ক্লোজ লজিক
  useEffect(() => {
    if (open) {
      setIsNavigating(false);
      onOpenChange(false);
    }
  }, [pathname]);

  // ২. ব্যাক বাটন হ্যান্ডলার
  useEffect(() => {
    if (open) {
      registerBackHandler(() => onOpenChange(false));
    } else {
      registerBackHandler(null);
    }
    return () => registerBackHandler(null);
  }, [open, onOpenChange]);

  // ৩. হিস্ট্রি লোড
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
           setRecentSearches(parsed);
        } else {
           localStorage.removeItem('recentSearches');
           setRecentSearches([]);
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // ৪. সার্চ রেজাল্ট ফেচিং
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setResults(data.products);
        } else {
           setResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // ৫. ক্লিক হ্যান্ডলার
  const handleProductClick = (slug: string) => {
    setIsNavigating(true);
    addToHistory(query);
    router.push(`/menus/${slug}`);
  };

  const addToHistory = (term: string) => {
    if (!term.trim()) return;
    const newHistory = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newHistory);
    localStorage.setItem('recentSearches', JSON.stringify(newHistory));
  };

  const removeHistory = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = recentSearches.filter(s => s !== term);
    setRecentSearches(newHistory);
    localStorage.setItem('recentSearches', JSON.stringify(newHistory));
  };

  const getCategoryName = (category: any) => {
      if (!category) return '';
      if (typeof category === 'string') return category;
      if (typeof category === 'object' && category.name) return category.name;
      return '';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children && (
        <SheetTrigger asChild>
            {children}
        </SheetTrigger>
      )}
      
      <SheetContent side="left" className="w-full sm:w-[400px] p-0 gap-0 border-r bg-background">
        
        {/* নেভিগেশন লোডার ওভারলে */}
        {isNavigating && (
          <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
            <p className="text-sm font-medium text-muted-foreground animate-pulse">Taking you there...</p>
          </div>
        )}

        <SheetHeader className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <SheetTitle className="sr-only">Search</SheetTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you craving?" 
              className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
              autoFocus
              disabled={isNavigating}
            />
            {query && !isNavigating && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-muted rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-6">

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Finding delicious items...</p>
              </div>
            )}

            {!isLoading && query.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Search Results ({results.length})
                </h3>
                
                {results.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-lg">😕</p>
                    <p className="text-muted-foreground mt-2">No items found for "{query}"</p>
                  </div>
                ) : (
                  results.map((product, index) => {
                    // ✅ ইমেজের URL বের করার লজিক
                    const rawUrl = (product.images && product.images.length > 0 && product.images[0].url) 
                        ? product.images[0].url 
                        : (PLACEHOLDER_IMAGE_URL || '/placeholder.png');

                    return (
                      <div 
                        key={`${product._id || 'prod'}-${index}`} 
                        onClick={() => handleProductClick(product.slug)}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group border border-transparent hover:border-border"
                      >
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                          {/* ✅ অপটিমাইজড ইমেজ এবং sizes সেট করা হয়েছে */}
                          <Image 
                            src={optimizeImageUrl(rawUrl)} 
                            alt={product.name} 
                            fill
                            sizes="64px" // 16 * 4 = 64px
                            className="object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = PLACEHOLDER_IMAGE_URL || '/placeholder.png';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                              {getCategoryName(product.category)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold">₹{product.price}</span>
                            {product.discountPrice && (
                              <span className="text-xs text-muted-foreground line-through">₹{product.discountPrice}</span>
                            )}
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {!isLoading && query.length === 0 && (
              <>
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" /> Recent Searches
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-red-500"
                        onClick={() => {
                          setRecentSearches([]);
                          localStorage.removeItem('recentSearches');
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((term, i) => (
                        <div 
                          key={`hist-${i}`}
                          onClick={() => setQuery(term)}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors"
                        >
                          <span className="text-sm text-muted-foreground group-hover:text-foreground">{term}</span>
                          <button 
                            onClick={(e) => removeHistory(term, e)}
                            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-primary" /> Trending Now
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_TAGS.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="px-3 py-1.5 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-sm font-normal"
                        onClick={() => setQuery(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}