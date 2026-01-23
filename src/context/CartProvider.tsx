// src/context/CartProvider.tsx

'use client';

import React, { createContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react';
import type { CartItem, Product } from '@/lib/types';
import { toast } from 'sonner';
import Pusher from 'pusher-js';
import { useAuth } from '@/hooks/use-auth'; // ★★★ useAuth ইমপোর্ট

const CART_STORAGE_KEY = 'bumbas-kitchen-cart';

type CheckoutState = {
    couponCode: string;
    couponDiscount: number;
    useCoins: boolean;
};

type CartState = {
  items: CartItem[];
  checkoutState: CheckoutState;
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; payload: { items: CartItem[] } }
  | { type: 'SET_CHECKOUT_DATA'; payload: Partial<CheckoutState> };

const initialState: CartState = { 
    items: [],
    checkoutState: { couponCode: '', couponDiscount: 0, useCoins: false }
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity } = action.payload;
      const existingItem = state.items.find((item) => item.id === product.id);
      
      const maxStock = product.stock || 100; 
      const currentQty = existingItem ? existingItem.quantity : 0;

      if (currentQty + quantity > maxStock) {
         toast.error(`Only ${maxStock} items available.`);
         return state;
      }

      let newItems;
      if (existingItem) {
        newItems = state.items.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        const newItem: CartItem = {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.images && product.images.length > 0 ? product.images[0] : { id: 'def', url: '', alt: product.name },
          quantity: quantity,
        };
        newItems = [...state.items, newItem];
      }
      return { ...state, items: newItems };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((item) => item.id !== action.payload.id) };
    case 'UPDATE_QUANTITY':
        if (action.payload.quantity <= 0) return { ...state, items: state.items.filter((item) => item.id !== action.payload.id) };
        return { ...state, items: state.items.map((item) => item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item) };
    case 'CLEAR_CART':
      return { ...state, items: [], checkoutState: { couponCode: '', couponDiscount: 0, useCoins: false } };
    case 'SET_CART':
      return { ...state, items: action.payload.items };
    case 'SET_CHECKOUT_DATA':
        return { ...state, checkoutState: { ...state.checkoutState, ...action.payload } };
        
    default:
      return state;
  }
};

export const CartContext = createContext<any>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDirty, setIsDirty] = useState(false); 
  const [isSyncing, setIsSyncing] = useState(false);
  
  // ★★★ useAuth থেকে ইউজার ইনফো (Token ডিকোড করার দরকার নেই)
  const { user, isLoading: authLoading } = useAuth();

  // ডাটাবেস সিঙ্ক
  const syncToDatabase = useCallback(async (items: CartItem[]) => {
      // ★ Fix: টোকেন চেক এবং হেডার রিমুভ করা হয়েছে
      if (!user) return; // ইউজার না থাকলে সিঙ্ক হবে না
      
      setIsSyncing(true);
      try {
          await fetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }, // ★ Authorization Header বাদ
              body: JSON.stringify({ items })
          });
          setIsDirty(false);
      } catch (error) { console.error("Sync failed", error); } 
      finally { setIsSyncing(false); }
  }, [user]);

  // ইনিশিয়াল লোড
  useEffect(() => {
    // Auth loading শেষ না হওয়া পর্যন্ত অপেক্ষা
    if (authLoading) return;

    const initializeCart = async () => {
        let localItems: CartItem[] = [];
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        
        if (storedCart) {
            try {
                const parsed = JSON.parse(storedCart);
                if (parsed.items) localItems = parsed.items;
            } catch (e) {}
        }

        if (user) {
            try {
                // ★ Fix: হেডার ছাড়া রিকোয়েস্ট (কুকি যাবে)
                const res = await fetch('/api/cart');
                const data = await res.json();
                if (data.success) {
                    dispatch({ type: 'SET_CART', payload: { items: data.items || [] } });
                    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: data.items || [] }));
                } else {
                    dispatch({ type: 'SET_CART', payload: { items: localItems } });
                    if (localItems.length > 0) {
                         setIsDirty(true); // লোকাল আইটেম থাকলে সার্ভারে পাঠাতে হবে
                    }
                }
            } catch (e) {
                dispatch({ type: 'SET_CART', payload: { items: localItems } });
            }
        } else {
            // ইউজার না থাকলে শুধুই লোকাল স্টোরেজ
            dispatch({ type: 'SET_CART', payload: { items: localItems } });
        }
        setIsInitialized(true);
    };
    initializeCart();
  }, [user, authLoading]); // user চেঞ্জ হলে রি-রান হবে

  // স্টেট সেভ (Local Storage)
  useEffect(() => {
    if (isInitialized) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isInitialized]);

  // পিরিওডিক সিঙ্ক
  useEffect(() => {
    const interval = setInterval(() => {
        if (user && isDirty && !isSyncing) syncToDatabase(state.items);
    }, 30000);
    return () => clearInterval(interval);
  }, [isDirty, isSyncing, state.items, syncToDatabase, user]);

  // ★★★ Pusher Fix: টোকেন ডিকোড না করে user.id ব্যবহার
  useEffect(() => {
      if (!user || !isInitialized) return;

      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });
      
      // ★ user.id সরাসরি ব্যবহার
      const channel = pusher.subscribe(`user-${user.id}`);
      
      channel.bind('cart-updated', (data: any) => {
          if (!isSyncing) {
              dispatch({ type: 'SET_CART', payload: { items: data.items } });
              localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: data.items }));
              setIsDirty(false); 
          }
      });
      return () => { pusher.unsubscribe(`user-${user.id}`); };
  }, [isInitialized, isSyncing, user]);

  // অ্যাকশনস
  const addItem = (product: Product, quantity: number = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
    setIsDirty(true);
    toast.success(`Added "${product.name}" to cart`);
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
    setIsDirty(true);
    toast.info("Item removed");
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    setIsDirty(true);
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    setIsDirty(true);
    if (user) syncToDatabase([]); 
  };

  const setCheckoutData = (data: Partial<CheckoutState>) => {
      dispatch({ type: 'SET_CHECKOUT_DATA', payload: data });
  };

  const itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
  const totalPrice = state.items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setCheckoutData,
        itemCount,
        totalPrice,
        checkoutState: state.checkoutState,
        isInitialized,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};