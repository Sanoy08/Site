// src/app/(shop)/checkout/page.tsx

'use client';

import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Lock, ChevronDown, ChevronUp, MapPin, Loader2, Ticket, Coins, Calendar as CalendarIcon, AlertCircle, Home, Briefcase, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { PLACEHOLDER_IMAGE_URL } from '@/lib/constants';
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, setMonth, setYear, getMonth, getYear, addMonths, subMonths } from "date-fns";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Haptics, NotificationType } from '@capacitor/haptics';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { optimizeImageUrl } from '@/lib/imageUtils';

// ★ Capacitor Plugin Import
import { Capacitor, registerPlugin } from '@capacitor/core';
const NativeSuccess = registerPlugin<any>('NativeSuccess');

const checkoutSchema = z.object({
  preferredDate: z.string().min(1, 'Please select a preferred date.'),
  mealTime: z.enum(['lunch', 'dinner']),
  instructions: z.string().optional(),
  terms: z.boolean().refine(val => val === true, { message: "You must agree to the Terms and Conditions." })
});

const FloatingLabelTextarea = ({ field, label }: any) => (
  <div className="relative">
    <Textarea placeholder=" " {...field} value={field.value ?? ''} className="block px-4 pb-2.5 pt-6 w-full text-sm text-foreground bg-background border-muted-foreground/30 rounded-xl border appearance-none focus:outline-none focus:ring-0 focus:border-primary peer min-h-[100px] transition-all shadow-sm hover:border-primary/50 resize-y" />
    <FormLabel className="absolute text-sm text-muted-foreground duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto pointer-events-none bg-background px-1">{label}</FormLabel>
  </div>
);

const slideVariants = { enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }) };
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear + 1];

function SwipeableCalendar({ selected, onSelect, viewDate, setViewDate, onClose }: any) {
  const [direction, setDirection] = useState(0);
  const handleMonthChange = (idx: number) => { setDirection(idx > getMonth(viewDate) ? 1 : -1); setViewDate(setMonth(viewDate, idx)); };
  const handleYearChange = (yr: string) => setViewDate(setYear(viewDate, parseInt(yr)));
  const onDragEnd = (e: any, info: PanInfo) => {
    if (info.offset.x < -50) { setDirection(1); setViewDate(addMonths(viewDate, 1)); } 
    else if (info.offset.x > 50) { setDirection(-1); setViewDate(subMonths(viewDate, 1)); }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white overflow-hidden">
        <div className="flex gap-2 w-full max-w-xs z-20 relative">
            <Select value={months[getMonth(viewDate)]} onValueChange={(m) => handleMonthChange(months.indexOf(m))}><SelectTrigger className="w-[140px] h-10 border-primary/20 bg-primary/5 focus:ring-primary rounded-lg"><SelectValue placeholder="Month" /></SelectTrigger><SelectContent>{months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
            <Select value={getYear(viewDate).toString()} onValueChange={handleYearChange}><SelectTrigger className="w-[120px] h-10 border-primary/20 bg-primary/5 focus:ring-primary rounded-lg"><SelectValue placeholder="Year" /></SelectTrigger><SelectContent>{years.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="relative w-full overflow-hidden min-h-[350px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div key={viewDate.toISOString()} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={onDragEnd} className="w-full h-full cursor-grab active:cursor-grabbing touch-pan-y">
              <Calendar mode="single" month={viewDate} onMonthChange={setViewDate} selected={selected} onSelect={(date) => { onSelect(date); onClose(); }} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus className="rounded-md border-0 w-full"
                  classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0", month: "space-y-4 w-full", caption: "hidden", nav: "hidden", 
                      table: "w-full border-collapse space-y-1 select-none", head_row: "flex w-full justify-between", head_cell: "text-muted-foreground rounded-md w-9 font-medium text-[0.8rem] h-9 flex items-center justify-center", row: "flex w-full mt-2 justify-between", cell: "h-10 w-10 text-center text-sm p-0 relative", 
                      day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 rounded-xl transition-all data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:shadow-lg", day_today: "bg-primary/5 text-primary font-bold border border-primary/20", day_outside: "text-muted-foreground opacity-30", day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed line-through", day_hidden: "invisible",
                  }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { state, totalPrice, itemCount, clearCart, isInitialized, checkoutState } = useCart();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const { couponCode, couponDiscount, useCoins, coinDiscount: savedCoinDiscount } = checkoutState;

  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [timeValidationError, setTimeValidationError] = useState({ show: false, title: '', message: '' });

  // ★ Wallet Earn Rate Fetching for Native Plugin
  const [earnRate, setEarnRate] = useState(2);

  useEffect(() => {
    if (!isLoading && !isInitialized) return;
    if (!isLoading && !user) { toast.error("Please login to checkout."); router.push('/login'); return; }
    if (isInitialized && itemCount === 0 && !isSuccess) router.push('/menus');
  }, [itemCount, user, isLoading, isInitialized, router, isSuccess]);

  useEffect(() => {
    const fetchAddressesAndWallet = async () => {
        if (!user) return;
        try {
            // Fetch Addresses
            const resAddr = await fetch('/api/user/addresses');
            const dataAddr = await resAddr.json();
            if (dataAddr.success && dataAddr.addresses) {
                setAddresses(dataAddr.addresses);
                const defaultAddr = dataAddr.addresses.find((a: any) => a.isDefault) || dataAddr.addresses[0];
                if (defaultAddr) setSelectedAddressId(defaultAddr.id);
            }
            
            // Fetch Wallet info for Earn Rate
            const resWallet = await fetch('/api/wallet');
            const dataWallet = await resWallet.json();
            if (dataWallet.success && dataWallet.wallet) {
                const totalSpent = dataWallet.wallet.totalSpent || 0;
                if (totalSpent >= 15000) setEarnRate(6);
                else if (totalSpent >= 5000) setEarnRate(4);
                else setEarnRate(2);
            }
        } catch (error) {}
    };
    fetchAddressesAndWallet();
  }, [user]);

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { preferredDate: '', mealTime: 'lunch', instructions: '', terms: false },
  });

  const getIcon = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('home')) return <Home className="h-5 w-5" />;
      if (n.includes('work') || n.includes('office')) return <Briefcase className="h-5 w-5" />;
      return <MapPin className="h-5 w-5" />;
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const currentDeliveryFee = orderType === 'delivery' ? (selectedAddress?.deliveryFee || 0) : 0;
  const coinDiscountAmount = useCoins ? (savedCoinDiscount || 0) : 0;
  const finalTotal = Math.max(0, totalPrice + currentDeliveryFee - couponDiscount - coinDiscountAmount);

  async function onSubmit(values: z.infer<typeof checkoutSchema>) {
    if (orderType === 'delivery' && !selectedAddress) {
        toast.error("Please select a delivery address.");
        return;
    }

    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const currentHour = today.getHours();

    if (values.preferredDate === todayStr) {
        if (values.mealTime === 'lunch' && currentHour >= 9) {
            await Haptics.notification({ type: NotificationType.Error });
            setTimeValidationError({ show: true, title: "Time Limit Exceeded!", message: "Today's lunch orders are accepted until 9 AM only. Please select a future date." });
            return; 
        }
        if (values.mealTime === 'dinner' && currentHour >= 18) {
            await Haptics.notification({ type: NotificationType.Error });
            setTimeValidationError({ show: true, title: "Time Limit Exceeded!", message: "Today's dinner orders are accepted until 6 PM only. Please select a future date." });
            return;
        }
    }

    setIsSubmitting(true);
    try {
        const orderPayload = {
            ...values,
            name: user?.name || 'Customer',
            altPhone: user?.phone || '',
            items: state.items,
            subtotal: totalPrice,
            deliveryFee: currentDeliveryFee, 
            total: finalTotal,
            discount: couponDiscount + coinDiscountAmount,
            couponCode: couponCode,
            useCoins: useCoins,
            orderType: orderType,
            address: selectedAddress ? selectedAddress.address : 'Store Pickup',
            deliveryAddress: selectedAddress ? selectedAddress.address : undefined,
            coordinates: selectedAddress ? selectedAddress.coordinates : null
        };

        const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Order placement failed');

        setIsSuccess(true);
        clearCart();
        
        const orderNum = data.orderId || '0000'; 
        // ডেলিভারি ফি বাদ দিয়ে শুধু খাবারের দামের ওপর কয়েন হিসাব হবে
const eligibleAmountForCoins = Math.max(0, totalPrice - couponDiscount);
const earnedCoins = Math.floor((eligibleAmountForCoins * earnRate) / 100);

        // ★ DIRECT NATIVE TRIGGER (0 Delay)
        if (Capacitor.isNativePlatform()) {
            NativeSuccess.show({
                orderId: orderNum,
                name: user?.name?.split(' ')[0] || 'Customer',
                amount: formatPrice(finalTotal),
                coins: earnedCoins > 0 ? earnedCoins : 1
            });
            router.push('/account/orders');
        } else {
            // ওয়েব ইউজারদের জন্যও সরাসরি Orders পেজেই পাঠিয়ে দাও (কারণ success page নেই)
            toast.success("Order Placed Successfully!");
            router.push('/account/orders');
        }
        
    } catch (error: any) {
        toast.error(error.message || "Failed to place order.");
        setIsSubmitting(false); // Error হলে সাবমিট বাটন আবার চালু হবে
    }
  }

  if (!isInitialized || isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!user) return null;
  if (itemCount === 0 && !isSuccess) return null;

  return (
    <div className="container py-8 md:py-12 max-w-6xl">
      
      <AlertDialog open={timeValidationError.show} onOpenChange={(open) => setTimeValidationError(prev => ({ ...prev, show: open }))}>
        <AlertDialogContent className="rounded-2xl max-w-[90%] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-6 w-6" />{timeValidationError.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-foreground/80 mt-2">{timeValidationError.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction onClick={() => setTimeValidationError({ show: false, title: '', message: '' })} className="w-full sm:w-auto rounded-xl">I Understand</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mobile Summary */}
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
                          <div key={item.id} className="flex justify-between"><span className="text-muted-foreground">{item.quantity}x {item.name}</span><span className="font-medium">{formatPrice(item.price * item.quantity)}</span></div>
                      ))}
                      <Separator className="my-2"/>
                      <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPrice(totalPrice)}</span></div>
                      
                      <div className="flex justify-between text-muted-foreground">
                          <span>Delivery Fee {orderType === 'pickup' && '(Pickup)'}</span>
                          <span className={currentDeliveryFee === 0 ? "text-green-600 font-medium" : "font-medium"}>
                              {orderType === 'pickup' ? "Free" : currentDeliveryFee === 0 ? "Free" : formatPrice(currentDeliveryFee)}
                          </span>
                      </div>

                      {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coupon</span><span>- {formatPrice(couponDiscount)}</span></div>}
                      {coinDiscountAmount > 0 && <div className="flex justify-between text-amber-600"><span>Coins</span><span>- {formatPrice(coinDiscountAmount)}</span></div>}
                  </div>
              </CardContent>
            )}
        </Card>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold font-headline mb-8 text-center">Final Checkout</h1>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div className="lg:col-span-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-4">
                  <h3 className="text-lg font-bold">Delivery Method</h3>
                  <div className="flex gap-4 p-1 bg-muted/20 rounded-2xl border">
                      <Button type="button" onClick={() => setOrderType('delivery')} className={cn("flex-1 h-12 rounded-xl font-medium transition-all", orderType === 'delivery' ? "bg-white text-primary shadow-sm border border-primary/10" : "bg-transparent text-muted-foreground hover:bg-white/50")}>Delivery</Button>
                      <Button type="button" onClick={() => setOrderType('pickup')} className={cn("flex-1 h-12 rounded-xl font-medium transition-all", orderType === 'pickup' ? "bg-white text-primary shadow-sm border border-primary/10" : "bg-transparent text-muted-foreground hover:bg-white/50")}>Pickup</Button>
                  </div>
              </div>

              {orderType === 'delivery' ? (
                  <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                      <div className="flex justify-between items-center">
                          <h3 className="text-lg font-bold">Select Delivery Address</h3>
                          <Button variant="link" size="sm" className="text-primary" onClick={(e) => { e.preventDefault(); router.push('/account/addresses'); }}>
                              <Plus className="h-4 w-4 mr-1"/> Add New
                          </Button>
                      </div>

                      {addresses.length === 0 ? (
                          <div className="text-center py-10 bg-muted/20 rounded-2xl border border-dashed">
                              <MapPin className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                              <p className="text-muted-foreground mb-3">No saved addresses found.</p>
                              <Button onClick={(e) => { e.preventDefault(); router.push('/account/addresses'); }}>Add Address</Button>
                          </div>
                      ) : (
                          <div className="grid gap-3">
                              {addresses.map((addr) => (
                                  <div 
                                      key={addr.id} 
                                      onClick={() => setSelectedAddressId(addr.id)}
                                      className={`relative border rounded-2xl p-4 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 bg-white hover:border-primary/40 hover:bg-gray-50'}`}
                                  >
                                      <div className="flex gap-4">
                                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${selectedAddressId === addr.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                                              {getIcon(addr.name)}
                                          </div>
                                          <div className="flex-1">
                                              <div className="flex justify-between items-start">
                                                  <h4 className="font-bold text-foreground">{addr.name}</h4>
                                                  {selectedAddressId === addr.id && <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />}
                                              </div>
                                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{addr.address}</p>
                                              
                                              {/* Delivery Fee Display */}
                                              <div className="mt-2 flex items-center gap-2">
                                                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">Dist: {addr.distanceText}</span>
                                                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${addr.deliveryFee === 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                      Fee: {addr.deliveryFee === 0 ? 'FREE' : formatPrice(addr.deliveryFee)}
                                                  </span>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              ) : (
                <div className="p-5 border rounded-xl bg-blue-50/50 animate-in fade-in slide-in-from-top-2 text-center space-y-2 border-blue-100">
                    <p className="font-medium text-lg text-blue-900"><strong>Store Location:</strong> Janai, Garbagan, Hooghly (PIN: 712304)</p>
                    <a href="https://maps.google.com/?q=22.717958,88.260207" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 underline font-medium text-sm transition-colors"><MapPin className="h-4 w-4" /> View on Maps</a>
                </div>
              )}

              <div className="space-y-4 pt-2">
                  <h3 className="text-lg font-bold">Preferences</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="preferredDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground ml-1">Date</FormLabel>
                            <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <DialogTrigger asChild>
                                    <FormControl>
                                      <Button variant={"outline"} className={cn("h-12 w-full rounded-xl pl-3 text-left font-normal border-muted-foreground/30 bg-background hover:bg-background/50 transition-all", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(new Date(field.value), "MMM do, yyyy") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                </DialogTrigger>
                                <DialogContent className="w-[90%] max-w-[340px] p-0 rounded-3xl overflow-hidden border-0 shadow-2xl bg-white">
                                    <DialogHeader className="p-5 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
                                        <DialogTitle className="text-center text-primary flex flex-col items-center gap-1">
                                            <span className="text-lg">Select Delivery Date</span>
                                        </DialogTitle>
                                    </DialogHeader>
                                    <SwipeableCalendar viewDate={viewDate} setViewDate={setViewDate} selected={field.value ? new Date(field.value) : undefined} onSelect={(date: any) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} onClose={() => setIsCalendarOpen(false)} />
                                </DialogContent>
                            </Dialog>
                            <FormMessage />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name="mealTime" render={({ field }) => ( <FormItem><FormLabel className="text-xs text-muted-foreground ml-1">Time</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-12 rounded-xl bg-background"><SelectValue placeholder="Time" /></SelectTrigger></FormControl><SelectContent><SelectItem value="lunch">Lunch</SelectItem><SelectItem value="dinner">Dinner</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                  </div>
                  <FormField control={form.control} name="instructions" render={({ field }) => ( <FormItem><FormControl><FloatingLabelTextarea field={field} label="Cooking Instructions (Optional)" /></FormControl><FormMessage /></FormItem> )} />
              </div>

              <FormField control={form.control} name="terms" render={({ field }) => ( 
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-xl bg-muted/10">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <div className="space-y-1 leading-none text-sm">
                          <FormLabel className="font-normal text-muted-foreground">I agree to the <a href="/terms" target="_blank" className="underline text-primary hover:text-primary/80">Terms & Conditions</a> and Refund Policy.</FormLabel>
                          <FormMessage />
                      </div>
                  </FormItem> 
              )} />
              
              <Button type="submit" disabled={isSubmitting || (orderType === 'delivery' && !selectedAddress)} size="lg" className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]">
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
                {isSubmitting ? 'Placing Order...' : `Place Order — ${formatPrice(finalTotal)}`}
              </Button>
            </form>
          </Form>
        </div>

        {/* Desktop Summary */}
        <div className="lg:col-span-1 hidden lg:block">
          <Card className="sticky top-24 bg-card shadow-lg border-0 overflow-hidden">
            <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle>Payment Details</CardTitle></CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {state.items.map((item) => {
                        const rawUrl = (item.image && item.image.url) ? item.image.url : PLACEHOLDER_IMAGE_URL;
                        return (
                            <div key={item.id} className="flex gap-4 items-center">
                                <div className="relative h-14 w-14 rounded-lg overflow-hidden border bg-muted flex-shrink-0"><Image src={optimizeImageUrl(rawUrl)} alt={item.name} fill sizes="56px" className="object-cover" /></div>
                                <div className="flex-grow min-w-0"><p className="font-medium text-sm truncate">{item.name}</p><p className="text-xs text-muted-foreground">Qty: {item.quantity}</p></div>
                                <p className="font-semibold text-sm whitespace-nowrap">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                        );
                    })}
                </div>
                <Separator />
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPrice(totalPrice)}</span></div>
                    {couponDiscount > 0 && <div className="flex justify-between text-green-600 font-medium"><span className="flex items-center gap-1"><Ticket className="h-3 w-3"/> Coupon Applied</span><span>- {formatPrice(couponDiscount)}</span></div>}
                    {coinDiscountAmount > 0 && <div className="flex justify-between text-amber-600 font-medium"><span className="flex items-center gap-1"><Coins className="h-3 w-3"/> Coins Redeemed</span><span>- {formatPrice(coinDiscountAmount)}</span></div>}
                    
                    <div className="flex justify-between text-muted-foreground">
                        <span>Delivery Fee {orderType === 'pickup' && '(Pickup)'}</span>
                        <span className={currentDeliveryFee === 0 ? "text-green-600 font-medium" : "font-medium"}>
                            {orderType === 'pickup' ? "Free" : currentDeliveryFee === 0 ? "Free (Under 2km)" : formatPrice(currentDeliveryFee)}
                        </span>
                    </div>

                    <Separator className="my-2"/>
                    <div className="flex justify-between text-xl font-bold text-primary"><span>Total Payable</span><span>{formatPrice(finalTotal)}</span></div>
                    <p className="text-xs text-right text-muted-foreground">Inclusive of all taxes</p>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}