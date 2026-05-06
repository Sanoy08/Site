// src/components/shop/ProductCard.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product, CartItem } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Plus, Minus, ShoppingCart, Ban } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Badge } from '../ui/badge';
import { differenceInDays } from 'date-fns';
import { PLACEHOLDER_IMAGE_URL } from '@/lib/constants';
import { SpecialDishCard } from './SpecialDishCard';
import { optimizeImageUrl } from '@/lib/imageUtils';

// ★ Capacitor Imports
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { state, addItem, updateQuantity } = useCart();
  const cartItem = state.items.find((item: CartItem) => item.id === product.id);
  const isOutOfStock = product.stock <= 0;

  const isNew = product.createdAt && differenceInDays(new Date(), new Date(product.createdAt)) < 7;
  const hasValidImage = product.images && product.images.length > 0 && product.images[0].url && product.images[0].url.trim() !== '';
  const rawImageUrl = hasValidImage ? product.images[0].url : PLACEHOLDER_IMAGE_URL;
  const imageSrc = optimizeImageUrl(rawImageUrl);

  // ★ UNIVERSAL FLY TO CART LOGIC (From Specific Product Card) ★
  const flyToCart = (e: React.MouseEvent) => {
    const target = document.getElementById('global-cart-target');
    if (!target) return;

    // We will pop the image out of the specific "Add" button that was clicked
    const targetRect = target.getBoundingClientRect();
    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // Create the flying image
    const flyingImg = document.createElement('img');
    flyingImg.src = imageSrc; // Use this specific product's image
    flyingImg.style.position = 'fixed';
    flyingImg.style.zIndex = '99999';
    flyingImg.style.borderRadius = '12px'; // Square with rounded corners
    flyingImg.style.objectFit = 'cover';
    flyingImg.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)';
    flyingImg.style.pointerEvents = 'none';

    // Start from the specific button that was clicked
    const spawnSize = 100; // Medium popup size
    flyingImg.style.top = `${buttonRect.top - spawnSize}px`; // Starts above the button
    flyingImg.style.left = `${buttonRect.left + buttonRect.width/2 - spawnSize/2}px`;
    flyingImg.style.width = `${spawnSize}px`;
    flyingImg.style.height = `${spawnSize}px`;
    flyingImg.style.transform = 'scale(0.2) translateY(30px)';
    flyingImg.style.opacity = '0';
    flyingImg.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    document.body.appendChild(flyingImg);
    flyingImg.offsetWidth; // Force Reflow

    // 1. Pop In above the button
    flyingImg.style.transform = 'scale(1) translateY(0)';
    flyingImg.style.opacity = '1';

    // 2. Wait slightly, then Swing to Cart
    setTimeout(() => {
        // Parabolic curve (Swing)
        flyingImg.style.transition = 'top 0.7s cubic-bezier(0.5, -0.5, 1, 1), left 0.7s linear, width 0.7s ease-in, height 0.7s ease-in, opacity 0.7s ease-in, transform 0.7s linear';
        
        flyingImg.style.top = `${targetRect.top}px`;
        flyingImg.style.left = `${targetRect.left}px`;
        flyingImg.style.width = '24px';
        flyingImg.style.height = '24px';
        flyingImg.style.opacity = '0.3';
        flyingImg.style.transform = 'rotate(2turn)';
        
        setTimeout(() => {
            flyingImg.remove();
            // Trigger cart bump animation
            window.dispatchEvent(new Event('cart-animated-bump'));
        }, 700);
    }, 350); 
  };

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (isOutOfStock) return;
    
    addItem(product);

    // ★ Native Haptic Vibration (No Toast)
    if (Capacitor.isNativePlatform()) {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (err) {
            console.error("Haptics error", err);
        }
    }

    // Trigger Fly Animation
    flyToCart(e);
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (cartItem) {
        updateQuantity(product.id, cartItem.quantity + 1);
        if (Capacitor.isNativePlatform()) {
            try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (err) {}
        }
    }
  };

  const handleDecrease = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (cartItem) {
        updateQuantity(product.id, cartItem.quantity - 1);
        if (Capacitor.isNativePlatform()) {
            try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (err) {}
        }
    }
  };


  if (product.isDailySpecial && !hasValidImage) {
      return (
          <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow cursor-pointer group border-amber-200 shadow-md bg-amber-50/30">
              <Link href={`/menus/${product.slug}`} className="block h-full flex flex-col">
                  <div className="aspect-square relative w-full">
                      <SpecialDishCard 
                          name={product.name} 
                          description={product.description} 
                          price={product.price} 
                      />
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                         <Button size="icon" className="rounded-full shadow-lg h-12 w-12" onClick={handleAdd}>
                            <ShoppingCart className="h-5 w-5" />
                         </Button>
                      </div>
                  </div>
              </Link>
          </Card>
      );
  }

  return (
    <Card className={`flex flex-col overflow-hidden h-full transition-shadow hover:shadow-lg bg-card group border-muted/60 ${isOutOfStock ? 'opacity-75 grayscale-[0.5]' : ''}`}>
      <Link href={`/menus/${product.slug}`} className="block aspect-square relative overflow-hidden">
        {isOutOfStock ? (
            <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground z-10 shadow-sm pointer-events-none">Out of Stock</Badge>
        ) : isNew && (
            <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground z-10 shadow-sm">NEW</Badge>
        )}
        
        <Image 
            src={imageSrc} 
            alt={product.name} 
            width={500} 
            height={500} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
        />
        
        {isOutOfStock && <div className="absolute inset-0 bg-background/30 z-0" />}
      </Link>
      <CardContent className="p-3 flex flex-col flex-grow gap-2">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 h-10 text-foreground/90" title={product.name}>{product.name}</h3>
        <div className="flex items-center justify-between mt-auto pt-1">
            <p className={`font-bold text-base ${isOutOfStock ? 'text-muted-foreground' : 'text-primary'}`}>{formatPrice(product.price)}</p>
            <div onClick={(e) => e.preventDefault()}>
                {isOutOfStock ? (
                    <Button size="sm" disabled className="h-8 px-3 rounded-full bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-70"><Ban className="h-3.5 w-3.5 mr-1" /> <span className="text-xs font-medium">Sold Out</span></Button>
                ) : cartItem ? (
                    <div className="flex items-center h-8 border border-primary/30 rounded-full bg-background shadow-sm">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={handleDecrease}><Minus className="h-3 w-3" /></Button>
                        <span className="w-6 text-center font-bold text-sm">{cartItem.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={handleIncrease}><Plus className="h-3 w-3" /></Button>
                    </div>
                ) : (
                    <Button size="sm" className="h-8 px-4 rounded-full shadow-sm gap-1.5 bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95" onClick={handleAdd}><ShoppingCart className="h-3.5 w-3.5" /> <span className="text-xs font-semibold">Add</span></Button>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}