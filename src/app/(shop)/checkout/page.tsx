// src/app/(shop)/checkout/page.tsx

'use client';

import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Lock, ChevronDown, ChevronUp, MapPin, Loader2, Ticket, Coins, 
  Calendar as CalendarIcon, AlertCircle, Search 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { PLACEHOLDER_IMAGE_URL } from '@/lib/constants';

// --- Imports for Premium Calendar ---
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, setMonth, setYear, getMonth, getYear, addMonths, subMonths } from "date-fns";
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Haptics, NotificationType } from '@capacitor/haptics';
import { useDebounce } from '@/hooks/use-debounce';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ✅ আমাদের ইমেজ অপটিমাইজার ইমপোর্ট
import { optimizeImageUrl } from '@/lib/imageUtils';

// --- Zod Schema ---
const checkoutSchema = z.object({
  name: z.string().min(2, 'Please enter a valid name.'),
  address: z.string().min(10, 'Please enter your primary address (at least 10 characters).'),
  altPhone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number. Please enter a 10-digit Indian number.'),
  deliveryAddress: z.string().optional(),
  preferredDate: z.string().min(1, 'Please select a preferred date.'),
  mealTime: z.enum(['lunch', 'dinner']),
  instructions: z.string().optional(),
  terms: z.boolean().refine(val => val === true, {
    message: "You must agree to the Terms and Conditions."
  }),
  shareLocation: z.boolean().optional(),
});

// --- Helper Components ---
const FloatingLabelInput = ({ field, label, type = 'text' }: any) => (
  <div className="relative">
    <Input 
      type={type} 
      placeholder=" " 
      {...field} 
      value={field.value ?? ''} 
      className="block px-4 pb-2.5 pt-6 w-full text-sm text-foreground bg-background border-muted-foreground/30 rounded-xl border appearance-none focus:outline-none focus:ring-0 focus:border-primary peer h-12 transition-all shadow-sm hover:border-primary/50" 
    />
    <FormLabel className="absolute text-sm text-muted-foreground duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto pointer-events-none bg-background px-1">
      {label}
    </FormLabel>
  </div>
);

const FloatingLabelTextarea = ({ field, label }: any) => (
  <div className="relative">
    <Textarea 
      placeholder=" " 
      {...field} 
      value={field.value ?? ''}
      className="block px-4 pb-2.5 pt-6 w-full text-sm text-foreground bg-background border-muted-foreground/30 rounded-xl border appearance-none focus:outline-none focus:ring-0 focus:border-primary peer min-h-[100px] transition-all shadow-sm hover:border-primary/50 resize-y" 
    />
    <FormLabel className="absolute text-sm text-muted-foreground duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto pointer-events-none bg-background px-1">
      {label}
    </FormLabel>
  </div>
);

// --- ANIMATION VARIANTS FOR CALENDAR ---
const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
};

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear + 1];

// --- SWIPEABLE CALENDAR COMPONENT ---
function SwipeableCalendar({ 
  selected, 
  onSelect, 
  viewDate, 
  setViewDate, 
  onClose 
}: { 
  selected?: Date, 
  onSelect: (date?: Date) => void, 
  viewDate: Date, 
  setViewDate: (date: Date) => void,
  onClose: () => void
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
    <div className="flex flex-col items-center gap-4 p-4 bg-white overflow-hidden">
        {/* Selectors */}
        <div className="flex gap-2 w-full max-w-xs z-20 relative">
            <Select 
                value={months[getMonth(viewDate)]} 
                onValueChange={(month) => handleMonthChange(months.indexOf(month))}
            >
                <SelectTrigger className="w-[140px] h-10 border-primary/20 bg-primary/5 focus:ring-primary rounded-lg">
                    <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                    {months.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select 
                value={getYear(viewDate).toString()} 
                onValueChange={handleYearChange}
            >
                <SelectTrigger className="w-[120px] h-10 border-primary/20 bg-primary/5 focus:ring-primary rounded-lg">
                    <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                    {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {/* Animated Swipe Area */}
        <div className="relative w-full overflow-hidden min-h-[350px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={viewDate.toISOString()}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={onDragEnd}
              className="w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
            >
              <Calendar
                  mode="single"
                  month={viewDate}
                  onMonthChange={setViewDate}
                  selected={selected}
                  onSelect={(date) => {
                      onSelect(date);
                      onClose();
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="rounded-md border-0 w-full"
                  classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4 w-full",
                      caption: "hidden", 
                      nav: "hidden", 
                      table: "w-full border-collapse space-y-1 select-none",
                      head_row: "flex w-full justify-between",
                      head_cell: "text-muted-foreground rounded-md w-9 font-medium text-[0.8rem] h-9 flex items-center justify-center",
                      row: "flex w-full mt-2 justify-between",
                      cell: "h-10 w-10 text-center text-sm p-0 relative", 
                      day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 rounded-xl transition-all data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:shadow-lg",
                      day_today: "bg-primary/5 text-primary font-bold border border-primary/20",
                      day_outside: "text-muted-foreground opacity-30",
                      day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed line-through",
                      day_hidden: "invisible",
                  }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
        
        <p className="text-[10px] text-muted-foreground/60">Swipe left or right to change month</p>
    </div>
  );
}

// --- Main Component ---
export default function CheckoutPage() {
  const { state, totalPrice, itemCount, clearCart, isInitialized, checkoutState } = useCart();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const { couponCode, couponDiscount, useCoins } = checkoutState;

  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [walletBalance, setWalletBalance] = useState(0);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Calendar States
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(new Date());

  // --- OLA MAPS STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Time Validation Popup State
  const [timeValidationError, setTimeValidationError] = useState<{
    show: boolean;
    title: string;
    message: string;
  }>({ show: false, title: '', message: '' });

  // --- OLA MAPS EFFECT ---
  useEffect(() => {
    const fetchLocations = async () => {
        if (!debouncedSearch || debouncedSearch.length < 3) {
            setSuggestions([]);
            return;
        }

        try {
            const res = await fetch(`/api/location/autocomplete?q=${debouncedSearch}`);
            const data = await res.json();
            setSuggestions(data.suggestions || []);
            setShowSuggestions(true);
        } catch (e) {
            console.error("Location search failed", e);
        }
    };

    fetchLocations();
  }, [debouncedSearch]);

  const handleSelectAddress = (address: string) => {
    form.setValue('address', address, { shouldValidate: true });
    setSearchQuery("");
    setShowSuggestions(false);
    toast.success("Address updated!");
  };

  useEffect(() => {
      const fetchWallet = async () => {
          const token = localStorage.getItem('token');
          if(!token) return;
          try {
              const res = await fetch('/api/wallet', { headers: { 'Authorization': `Bearer ${token}` } });
              const data = await res.json();
              if(data.success) setWalletBalance(data.balance);
          } catch(e) {}
      };
      if (user) fetchWallet();
  }, [user]);

  useEffect(() => {
    if (!isLoading && !isInitialized) return;
    
    if (!isLoading && !user) {
      toast.error("Please login to checkout.");
      router.push('/login');
      return;
    }

    if (isInitialized && itemCount === 0 && !isSuccess) {
      router.push('/menus');
    }
  }, [itemCount, user, isLoading, isInitialized, router, isSuccess]);

  // Prevent Body Scroll when Calendar is Open
  useEffect(() => {
    if (isCalendarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isCalendarOpen]);

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '', address: '', altPhone: '', deliveryAddress: '',
      preferredDate: '', mealTime: 'lunch', instructions: '', terms: false, shareLocation: false,
    },
  });
  
  const { watch, setValue, reset } = form;
  const primaryAddress = watch('address');
  const [isSameAsAddress, setIsSameAsAddress] = useState(false);

  useEffect(() => {
    const initializeCheckoutData = async () => {
        if (!user) return;
        let savedAddress = '';
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const res = await fetch('/api/user/addresses', { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                if (data.success && Array.isArray(data.addresses)) {
                    const defaultAddr = data.addresses.find((a: any) => a.isDefault);
                    savedAddress = defaultAddr ? defaultAddr.address : (data.addresses[0]?.address || '');
                }
            }
        } catch (error) {}
        
        reset({
            name: user.name || '', 
            address: savedAddress, 
            altPhone: '', 
            deliveryAddress: '',
            preferredDate: '', 
            mealTime: 'lunch', 
            instructions: '', 
            terms: false, 
            shareLocation: false,
        });
    };
    initializeCheckoutData();
  }, [user, reset]);

  useEffect(() => {
    if (isSameAsAddress) setValue('deliveryAddress', primaryAddress);
    else if (watch('deliveryAddress') === primaryAddress) setValue('deliveryAddress', '');
  }, [isSameAsAddress, primaryAddress, setValue, watch]);

  const maxCoinDiscount = totalPrice * 0.5;
  const coinDiscountAmount = useCoins ? Math.min(walletBalance, Math.floor(maxCoinDiscount)) : 0;
  const finalTotal = Math.max(0, totalPrice - couponDiscount - coinDiscountAmount);

  async function onSubmit(values: z.infer<typeof checkoutSchema>) {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const currentHour = today.getHours();

    if (values.preferredDate === todayStr) {
        if (values.mealTime === 'lunch' && currentHour >= 9) {
            await Haptics.notification({ type: NotificationType.Error });
            setTimeValidationError({
                show: true,
                title: "Time Limit Exceeded!",
                message: "Today's lunch orders are accepted until 9 AM only. Please select a future date or choose Dinner."
            });
            return; 
        }

        if (values.mealTime === 'dinner' && currentHour >= 18) {
            await Haptics.notification({ type: NotificationType.Error });
            setTimeValidationError({
                show: true,
                title: "Time Limit Exceeded!",
                message: "Today's dinner orders are accepted until 6 PM only. Please select a future date."
            });
            return;
        }
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    try {
        const orderPayload = {
            ...values,
            items: state.items,
            subtotal: totalPrice,
            total: finalTotal,
            discount: couponDiscount + coinDiscountAmount,
            couponCode: couponCode,
            useCoins: useCoins,
            orderType: orderType,
            deliveryAddress: orderType === 'delivery' ? (values.deliveryAddress || values.address) : undefined,
        };

        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(orderPayload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Order placement failed');

        setIsSuccess(true);
        toast.warning('Almost there! ⏳', {
    description: 'Please verify your order on WhatsApp now.'
});
        clearCart();
        
        const orderNum = data.orderId || '0000'; 
        
        const params = new URLSearchParams({
            orderNumber: orderNum,
            name: values.name,
            amount: finalTotal.toString()
        });
        
        router.push(`/checkout/success?${params.toString()}`);

    } catch (error: any) {
        console.error("Checkout Error:", error);
        toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  }

  if (!isInitialized || isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  
  if (!user) return null;
  if (itemCount === 0 && !isSuccess) return null;

  return (
    <div className="container py-8 md:py-12 max-w-6xl">
      
      {/* --- POPUP COMPONENT (Alert Dialog) --- */}
      <AlertDialog open={timeValidationError.show} onOpenChange={(open) => setTimeValidationError(prev => ({ ...prev, show: open }))}>
        <AlertDialogContent className="rounded-2xl max-w-[90%] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
               <AlertCircle className="h-6 w-6" />
               {timeValidationError.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-foreground/80 mt-2">
              {timeValidationError.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setTimeValidationError({ show: false, title: '', message: '' })} className="w-full sm:w-auto rounded-xl">
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mobile Summary Accordion */}
      <div className="lg:hidden mb-6">
        <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between p-4 cursor-pointer bg-muted/10" onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">Order Summary</h2>
                {isSummaryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              <p className="font-bold text-lg text-primary">{formatPrice(finalTotal)}</p>
            </CardHeader>
            {isSummaryExpanded && (
              <CardContent className="p-4 border-t bg-white">
                  <div className="space-y-3 text-sm">
                      {state.items.map((item) => (
                          <div key={item.id} className="flex justify-between">
                              <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                      ))}
                      <Separator className="my-2"/>
                      <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPrice(totalPrice)}</span></div>
                      {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coupon</span><span>- {formatPrice(couponDiscount)}</span></div>}
                      {coinDiscountAmount > 0 && <div className="flex justify-between text-amber-600"><span>Coins</span><span>- {formatPrice(coinDiscountAmount)}</span></div>}
                  </div>
              </CardContent>
            )}
        </Card>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold font-headline mb-8 text-center">
        Final Checkout
      </h1>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        
        {/* --- LEFT: FORM SECTION --- */}
        <div className="lg:col-span-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-4">
                  <h3 className="text-lg font-bold">Contact Info</h3>
                  <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormControl><FloatingLabelInput field={field} label="Full Name" /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="altPhone" render={({ field }) => ( <FormItem><FormControl><FloatingLabelInput field={field} label="Phone Number" type="tel" /></FormControl><FormMessage /></FormItem> )} />
                  
                  {/* --- ADDRESS SECTION START --- */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-muted-foreground">Delivery Location</h4>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Ola Maps</span>
                    </div>

                    {/* Ola Maps Search */}
                    <div className="relative z-20">
                        <div className="relative">
                            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search area (e.g. Janai, Dankuni...)" 
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if(e.target.value.length === 0) setShowSuggestions(false);
                                }}
                                className="pl-9 h-11 rounded-xl border-primary/20 bg-white focus-visible:ring-primary/20"
                            />
                        </div>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                {suggestions.map((item: any) => (
                                    <div 
                                        key={item.place_id}
                                        onClick={() => handleSelectAddress(item.description)}
                                        className="p-3 hover:bg-muted/50 cursor-pointer flex items-start gap-3 border-b last:border-0 transition-colors"
                                    >
                                        <MapPin className="h-4 w-4 text-primary mt-1 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{item.main_text}</p>
                                            <p className="text-xs text-muted-foreground">{item.secondary_text}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-2 bg-muted/20 text-center border-t">
                                    <p className="text-[10px] text-muted-foreground">Powered by Ola Maps</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <FormField 
                        control={form.control} 
                        name="address" 
                        render={({ field }) => ( 
                            <FormItem>
                                <FormControl>
                                    <FloatingLabelTextarea field={field} label="Primary Address" />
                                </FormControl>
                                <FormMessage />
                            </FormItem> 
                        )} 
                    />
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="text-lg font-bold">Delivery Method</h3>
                  <div className="flex gap-4 p-1 bg-muted/20 rounded-2xl border">
                      <Button type="button" onClick={() => setOrderType('delivery')} className={cn("flex-1 h-12 rounded-xl font-medium transition-all", orderType === 'delivery' ? "bg-white text-primary shadow-sm border border-primary/10" : "bg-transparent text-muted-foreground hover:bg-white/50")}>Delivery</Button>
                      <Button type="button" onClick={() => setOrderType('pickup')} className={cn("flex-1 h-12 rounded-xl font-medium transition-all", orderType === 'pickup' ? "bg-white text-primary shadow-sm border border-primary/10" : "bg-transparent text-muted-foreground hover:bg-white/50")}>Pickup</Button>
                  </div>
              </div>

              {orderType === 'delivery' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border rounded-xl bg-gray-50/50 space-y-4">
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl><Checkbox checked={isSameAsAddress} onCheckedChange={() => setIsSameAsAddress(prev => !prev)} /></FormControl>
                            <div className="space-y-1 leading-none"><FormLabel className="font-normal cursor-pointer">Use as delivery address</FormLabel></div>
                        </FormItem>
                        
                        {!isSameAsAddress && (
                            <FormField control={form.control} name="deliveryAddress" render={({ field }) => ( <FormItem><FormControl><FloatingLabelInput field={field} label="Delivery Address" /></FormControl><FormMessage /></FormItem> )} />
                        )}
                    </div>
                </div>
              ) : (
                <div className="p-5 border rounded-xl bg-blue-50/50 animate-in fade-in slide-in-from-top-2 text-center space-y-2 border-blue-100">
                    <p className="font-medium text-lg text-blue-900"><strong>Store Location:</strong> Janai, Garbagan, Hooghly</p>
                    <a href="https://maps.google.com/?q=Janai,Garbagan,Hooghly" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 underline font-medium text-sm transition-colors"><MapPin className="h-4 w-4" /> View on Google Maps</a>
                </div>
              )}

              <div className="space-y-4 pt-2">
                  <h3 className="text-lg font-bold">Preferences</h3>
                  <div className="grid grid-cols-2 gap-4">
                      
                      {/* --- ★★★ PREMIUM DATE PICKER (Swipeable) ★★★ --- */}
                      <FormField
                        control={form.control}
                        name="preferredDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground ml-1">Date</FormLabel>
                            
                            <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <DialogTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "h-12 w-full rounded-xl pl-3 text-left font-normal border-muted-foreground/30 bg-background hover:bg-background/50 transition-all",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(new Date(field.value), "MMM do, yyyy")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                </DialogTrigger>
                                
                                {/* Center Modal Content */}
                                <DialogContent className="w-[90%] max-w-[340px] p-0 rounded-3xl overflow-hidden border-0 shadow-2xl bg-white">
                                    <DialogHeader className="p-5 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
                                        <DialogTitle className="text-center text-primary flex flex-col items-center gap-1">
                                            <span className="text-lg">Select Delivery Date</span>
                                        </DialogTitle>
                                    </DialogHeader>
                                    
                                    <SwipeableCalendar 
                                        viewDate={viewDate}
                                        setViewDate={setViewDate}
                                        selected={field.value ? new Date(field.value) : undefined}
                                        onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                        onClose={() => setIsCalendarOpen(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField control={form.control} name="mealTime" render={({ field }) => ( <FormItem><FormLabel className="text-xs text-muted-foreground ml-1">Time</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-12 rounded-xl bg-background"><SelectValue placeholder="Time" /></SelectTrigger></FormControl><SelectContent><SelectItem value="lunch">Lunch</SelectItem><SelectItem value="dinner">Dinner</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                  </div>
                  <FormField control={form.control} name="instructions" render={({ field }) => ( <FormItem><FormControl><FloatingLabelTextarea field={field} label="Cooking Instructions (Optional)" /></FormControl><FormMessage /></FormItem> )} />
              </div>

              <FormField control={form.control} name="terms" render={({ field }) => ( 
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-xl bg-muted/10">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <div className="space-y-1 leading-none text-sm">
                          <FormLabel className="font-normal text-muted-foreground">
                              I agree to the <a href="/terms" target="_blank" className="underline text-primary hover:text-primary/80">Terms & Conditions</a> and Refund Policy.
                          </FormLabel>
                          <FormMessage />
                      </div>
                  </FormItem> 
              )} />
              
              <Button type="submit" disabled={isSubmitting} size="lg" className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]">
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
                {isSubmitting ? 'Placing Order...' : `Place Order — ${formatPrice(finalTotal)}`}
              </Button>
            </form>
          </Form>
        </div>

        {/* --- RIGHT: ORDER SUMMARY (DESKTOP) --- */}
        <div className="lg:col-span-1 hidden lg:block">
          <Card className="sticky top-24 bg-card shadow-lg border-0 overflow-hidden">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {state.items.map((item) => {
                        // ✅ Raw URL বের করা
                        const rawUrl = (item.image && item.image.url) ? item.image.url : PLACEHOLDER_IMAGE_URL;
                        return (
                            <div key={item.id} className="flex gap-4 items-center">
                                <div className="relative h-14 w-14 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                                    {/* ✅ অপটিমাইজড ইমেজ এবং sizes সেট করা হয়েছে */}
                                    <Image 
                                      src={optimizeImageUrl(rawUrl)} 
                                      alt={item.name} 
                                      fill 
                                      sizes="56px"
                                      className="object-cover" 
                                    />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-medium text-sm truncate">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-semibold text-sm whitespace-nowrap">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                        );
                    })}
                </div>
                
                <Separator />

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{formatPrice(totalPrice)}</span>
                    </div>
                    
                    {couponDiscount > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                            <span className="flex items-center gap-1"><Ticket className="h-3 w-3"/> Coupon Applied</span>
                            <span>- {formatPrice(couponDiscount)}</span>
                        </div>
                    )}
                    
                    {coinDiscountAmount > 0 && (
                        <div className="flex justify-between text-amber-600 font-medium">
                            <span className="flex items-center gap-1"><Coins className="h-3 w-3"/> Coins Redeemed</span>
                            <span>- {formatPrice(coinDiscountAmount)}</span>
                        </div>
                    )}
                    
                    <div className="flex justify-between text-muted-foreground">
                        <span>Delivery Fee</span>
                        <span className="text-green-600 font-medium">Free</span>
                    </div>

                    <Separator className="my-2"/>
                    
                    <div className="flex justify-between text-xl font-bold text-primary">
                        <span>Total Payable</span>
                        <span>{formatPrice(finalTotal)}</span>
                    </div>
                    <p className="text-xs text-right text-muted-foreground">Inclusive of all taxes</p>
                </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}