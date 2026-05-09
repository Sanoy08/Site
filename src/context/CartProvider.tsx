// src/context/CartProvider.tsx

'use client';

import React, { createContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react';
import type { CartItem, Product } from '@/lib/types';
import { toast } from 'sonner';
import Pusher from 'pusher-js';
import { useAuth } from '@/hooks/use-auth';

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
  
  const { user, isLoading: authLoading } = useAuth();

  const syncToDatabase = useCallback(async (items: CartItem[]) => {
      if (!user) return;
      setIsSyncing(true);
      try {
          await fetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items })
          });
          setIsDirty(false);
      } catch (error) { console.error("Sync failed", error); } 
      finally { setIsSyncing(false); }
  }, [user]);

  useEffect(() => {
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
                const res = await fetch('/api/cart');
                const data = await res.json();
                if (data.success) {
                    dispatch({ type: 'SET_CART', payload: { items: data.items || [] } });
                    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: data.items || [] }));
                } else {
                    dispatch({ type: 'SET_CART', payload: { items: localItems } });
                    if (localItems.length > 0) {
                         setIsDirty(true);
                    }
                }
            } catch (e) {
                dispatch({ type: 'SET_CART', payload: { items: localItems } });
            }
        } else {
            dispatch({ type: 'SET_CART', payload: { items: localItems } });
        }
        setIsInitialized(true);
    };
    initializeCart();
  }, [user, authLoading]);

  useEffect(() => {
    if (isInitialized) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isInitialized]);

  useEffect(() => {
    const interval = setInterval(() => {
        if (user && isDirty && !isSyncing) syncToDatabase(state.items);
    }, 30000);
    return () => clearInterval(interval);
  }, [isDirty, isSyncing, state.items, syncToDatabase, user]);

  useEffect(() => {
      if (!user || !isInitialized) return;

      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });
      
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

  // ★★★ FIX: showToast অপশন যোগ করা হয়েছে (Default: true)
  const addItem = (product: Product, quantity: number = 1, showToast: boolean = true) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
    setIsDirty(true);
    if (showToast) {
        toast.success(`Added "${product.name}" to cart`, { duration: 2000 }); // এখানেও ডিউরেশন ফিক্স করা হলো
    }
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
    setIsDirty(true);
    toast.info("Item removed", { duration: 2000 });
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