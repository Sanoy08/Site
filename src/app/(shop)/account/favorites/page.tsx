// src/app/(shop)/account/favorites/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // ★ useRouter ইমপোর্ট করা হলো
import { formatPrice } from '@/lib/utils';
import { Heart, HeartCrack, Loader2, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { optimizeImageUrl } from '@/lib/imageUtils';

type FavoriteItem = {
  id: string;
  slug?: string; 
  name: string;
  image: string;
  price: number;
};

export default function AccountFavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ★ router ইনিশিয়ালাইজ করা হলো

  // Local Storage থেকে ডেটা লোড করা
  useEffect(() => {
    const savedFavs = JSON.parse(localStorage.getItem('bumbas_favorites') || '[]');
    setFavorites(savedFavs);
    setLoading(false);
  }, []);

  // আইটেম রিমুভ করার ফাংশন (এখন আর ইভেন্ট প্রিভেন্ট করার দরকার নেই)
  const removeFavorite = (id: string, name: string) => {
    const updatedFavs = favorites.filter((fav) => fav.id !== id);
    setFavorites(updatedFavs);
    localStorage.setItem('bumbas_favorites', JSON.stringify(updatedFavs));
    toast.info(`${name} removed from favorites`);
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                    <Heart className="h-5 w-5 fill-red-500" />
                </div>
                My Favorites
            </CardTitle>
            <CardDescription>
                Your handpicked delicious dishes
            </CardDescription>
        </CardHeader>

        <CardContent className="px-0">
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : favorites.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {favorites.map((item) => {
                        const hrefLink = `/menus/${item.slug || item.id}`;

                        return (
                            // ★ <Link> এর বদলে <div> এবং onClick ব্যবহার করা হলো
                            <div 
                                key={item.id}
                                onClick={() => router.push(hrefLink)}
                                className="group bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-red-300 transition-all cursor-pointer relative overflow-hidden"
                            >
                                {/* Left Indicator Line */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                {/* Image */}
                                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                                    <Image 
                                        src={optimizeImageUrl(item.image)} 
                                        alt={item.name} 
                                        fill 
                                        sizes="64px"
                                        className="object-cover"
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate text-base">{item.name}</h3>
                                    <p className="text-primary font-bold text-sm mt-0.5">{formatPrice(item.price)}</p>
                                </div>

                                {/* Remove Button */}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full shrink-0 z-10"
                                    onClick={(e) => {
                                        // ★ শুধু এই বাটনের ক্লিকটাই কাজ করবে, পেজ চেঞ্জ হবে না
                                        e.stopPropagation();
                                        removeFavorite(item.id, item.name);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Empty State */
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                    <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <HeartCrack className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No favorites yet</h3>
                    <p className="text-muted-foreground mt-1 mb-4 text-sm">You haven't added any dishes to your favorites.</p>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/menus">
                            <ShoppingBag className="h-4 w-4 mr-2" /> Browse Menu
                        </Link>
                    </Button>
                </div>
            )}
        </CardContent>
    </Card>
  );
}