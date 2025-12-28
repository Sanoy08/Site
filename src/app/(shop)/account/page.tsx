// src/app/(shop)/account/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Loader2, Cake, Heart, Lock, Eye, EyeOff, User, 
  Mail, ShieldCheck, Save, Sparkles, LogOut, CalendarIcon,
  ChevronRight, ShoppingBag, MapPin, Wallet, TicketPercent
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// --- CALENDAR IMPORTS (From your code) ---
import { Calendar } from "@/components/ui/calendar";
import { format, setMonth, setYear, getMonth, getYear, addMonths, subMonths } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence, PanInfo } from "framer-motion";

// --- SCHEMAS ---
const profileFormSchema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  email: z.string().email(),
  dob: z.string().optional(),
  anniversary: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(8, "Min 8 chars"),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// --- CALENDAR CONSTANTS (From your code) ---
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => currentYear - i);

// --- ANIMATION VARIANTS ---
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
};

// --- REUSABLE SWIPEABLE CALENDAR COMPONENT (Exact copy from your code) ---
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

  // Swipe Logic
  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      // Swipe Left -> Next Month
      setDirection(1);
      setViewDate(addMonths(viewDate, 1));
    } else if (info.offset.x > swipeThreshold) {
      // Swipe Right -> Previous Month
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
                <SelectTrigger className="w-[140px] h-10 border-amber-200 bg-amber-50/50 focus:ring-amber-500 rounded-lg">
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

        {/* Animated Swipe Area */}
        <div className="relative w-full overflow-hidden min-h-[350px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={viewDate.toISOString()} // Key change triggers animation
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              drag="x" // Enable horizontal drag
              dragConstraints={{ left: 0, right: 0 }} // Snap back
              dragElastic={0.2}
              onDragEnd={onDragEnd}
              className="w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
            >
              <Calendar
                  mode="single"
                  month={viewDate}
                  onMonthChange={setViewDate} // Keep sync
                  selected={selected}
                  onSelect={(date) => {
                      onSelect(date);
                      onClose();
                  }}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                  className="rounded-md border-0 w-full"
                  classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4 w-full",
                      caption: "hidden", 
                      nav: "hidden", 
                      table: "w-full border-collapse space-y-1 select-none", // Prevent text selection on swipe
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
        
        <p className="text-[10px] text-muted-foreground/60">Swipe left or right to change month</p>
    </div>
  );
}

// --- MENU ITEM ---
const MenuItem = ({ icon: Icon, title, subtitle, onClick, href, isDestructive = false }: any) => {
    const content = (
        <div className={cn(
            "flex items-center justify-between p-4 mb-3 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm group",
            isDestructive 
                ? "bg-red-50 border-red-100 hover:bg-red-100 hover:border-red-200" 
                : "bg-white border-gray-100 hover:border-primary/30 hover:shadow-md hover:bg-gray-50/50"
        )}>
            <div className="flex items-center gap-4">
                <div className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center transition-colors", 
                    isDestructive 
                        ? "bg-red-100 text-red-600" 
                        : "bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className={cn("font-bold text-sm", isDestructive ? "text-red-700" : "text-gray-900")}>{title}</p>
                    {subtitle && <p className={cn("text-xs mt-0.5 font-medium", isDestructive ? "text-red-500" : "text-gray-500")}>{subtitle}</p>}
                </div>
            </div>
            {!isDestructive && <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors" />}
        </div>
    );

    if (href) return <Link href={href} className="block">{content}</Link>;
    return <div onClick={onClick}>{content}</div>;
};

// --- MAIN PAGE ---
export default function AccountPage() {
  const { user, login, logout } = useAuth();
  const router = useRouter();
  
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  const [isDobOpen, setIsDobOpen] = useState(false);
  const [isAnniversaryOpen, setIsAnniversaryOpen] = useState(false);
  const [dobViewDate, setDobViewDate] = useState<Date>(new Date("2000-01-01"));
  const [anniversaryViewDate, setAnniversaryViewDate] = useState<Date>(new Date());

  const [walletBalance, setWalletBalance] = useState(0);

  const profileForm = useForm<ProfileFormValues>({ resolver: zodResolver(profileFormSchema), defaultValues: { firstName: '', lastName: '', email: '', dob: '', anniversary: '' } });
  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordFormSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });

  useEffect(() => {
    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const resAuth = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
            if (resAuth.ok) {
                const data = await resAuth.json();
                if (data.success) login(data.user, token);
            }
            const resWallet = await fetch('/api/wallet', { headers: { 'Authorization': `Bearer ${token}` } });
            if (resWallet.ok) {
                const walletData = await resWallet.json();
                if (walletData.success) setWalletBalance(walletData.balance);
            }
        } catch (e) { console.error("Error fetching data:", e); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (user) {
      const parts = user.name?.split(' ') || ['', ''];
      // @ts-ignore
      const uDob = user.dob || ''; // @ts-ignore
      const uAnniv = user.anniversary || '';
      profileForm.reset({ firstName: parts[0], lastName: parts.slice(1).join(' '), email: user.email || '', dob: uDob, anniversary: uAnniv });
      if (uDob) setDobViewDate(new Date(uDob));
      if (uAnniv) setAnniversaryViewDate(new Date(uAnniv));
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/auth/update-profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(data) });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error);
        login(resData.user, token || '');
        toast.success("Profile Updated");
        setIsEditProfileOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(data) });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error);
        toast.success("Password Changed");
        passwordForm.reset();
        setIsSecurityOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
  // @ts-ignore
  const hasDob = !!user?.dob && user.dob !== ""; // @ts-ignore
  const hasAnniversary = !!user?.anniversary && user.anniversary !== "";

  if (!user) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="bg-white min-h-screen pb-4">
        
        <div className="pt-2 pb-4">
            <h1 className="text-3xl font-bold font-headline text-gray-900">My Account</h1>
        </div>

        {/* --- PROFILE SECTION --- */}
        <div className="py-2 mb-2">
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-gray-100 shadow-sm">
                    <AvatarImage src={user.picture} />
                    <AvatarFallback className="bg-gradient-to-tr from-primary to-indigo-500 text-white font-bold text-xl">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 truncate">{user.name}</h2>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">+91 {user.phone || '----------'}</p>
                </div>
            </div>
            
            <div className="h-px bg-gray-100 w-full mt-4 mb-2" />

            <div className="flex justify-end">
                <Sheet open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 font-medium h-auto py-1 px-0 hover:bg-transparent">
                            Edit Profile
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <SheetHeader className="mb-6 border-b pb-4"><SheetTitle>Edit Profile Details</SheetTitle></SheetHeader>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6 px-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={profileForm.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={profileForm.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={profileForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} disabled className="bg-gray-50 rounded-xl" /></FormControl></FormItem>)} />
                                
                                <div className="space-y-4 pt-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                    <h4 className="font-semibold text-sm text-gray-600 flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" /> Special Dates</h4>
                                    
                                    {/* ★★★ PREMIUM DOB CALENDAR (Exact Match) ★★★ */}
                                    <FormField control={profileForm.control} name="dob" render={({ field }) => (
                                        <FormItem>
                                            <Dialog open={isDobOpen} onOpenChange={setIsDobOpen}>
                                                <DialogTrigger asChild>
                                                    <FormControl>
                                                        <div className={cn("flex items-center justify-between p-3.5 bg-white border rounded-xl cursor-pointer hover:border-primary/50 transition-colors", hasDob && "opacity-60 bg-gray-50 pointer-events-none")}>
                                                            <span className="text-sm font-medium flex items-center gap-3"><Cake className="h-4 w-4 text-pink-500" /> {field.value ? format(new Date(field.value), "MMMM do, yyyy") : <span className="text-gray-400">Add Birthday</span>}</span>
                                                            {!hasDob ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <Lock className="h-3 w-3 text-gray-400" />}
                                                        </div>
                                                    </FormControl>
                                                </DialogTrigger>
                                                {!hasDob && (
                                                    // ★★★ STYLE UPDATE: Premium Dialog Content ★★★
                                                    <DialogContent className="w-[90%] max-w-[340px] p-0 rounded-3xl overflow-hidden border-0 shadow-2xl bg-white">
                                                        <DialogHeader className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                                                            <DialogTitle className="text-center text-amber-900 flex flex-col items-center gap-1">
                                                                <span className="text-lg">Select Birthday 🎂</span>
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <SwipeableCalendar 
                                                            viewDate={dobViewDate} 
                                                            setViewDate={setDobViewDate} 
                                                            selected={field.value ? new Date(field.value) : undefined} 
                                                            onSelect={(d:any) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")} 
                                                            onClose={() => setIsDobOpen(false)} 
                                                        />
                                                    </DialogContent>
                                                )}
                                            </Dialog>
                                        </FormItem>
                                    )} />

                                    {/* ★★★ PREMIUM ANNIVERSARY CALENDAR (Exact Match) ★★★ */}
                                    <FormField control={profileForm.control} name="anniversary" render={({ field }) => (
                                        <FormItem>
                                            <Dialog open={isAnniversaryOpen} onOpenChange={setIsAnniversaryOpen}>
                                                <DialogTrigger asChild>
                                                    <FormControl>
                                                        <div className={cn("flex items-center justify-between p-3.5 bg-white border rounded-xl cursor-pointer hover:border-primary/50 transition-colors", hasAnniversary && "opacity-60 bg-gray-50 pointer-events-none")}>
                                                            <span className="text-sm font-medium flex items-center gap-3"><Heart className="h-4 w-4 text-red-500" /> {field.value ? format(new Date(field.value), "MMMM do, yyyy") : <span className="text-gray-400">Add Anniversary</span>}</span>
                                                            {!hasAnniversary ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <Lock className="h-3 w-3 text-gray-400" />}
                                                        </div>
                                                    </FormControl>
                                                </DialogTrigger>
                                                {!hasAnniversary && (
                                                    // ★★★ STYLE UPDATE: Premium Dialog Content ★★★
                                                    <DialogContent className="w-[90%] max-w-[340px] p-0 rounded-3xl overflow-hidden border-0 shadow-2xl bg-white">
                                                        <DialogHeader className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                                                            <DialogTitle className="text-center text-amber-900 flex flex-col items-center gap-1">
                                                                <span className="text-lg">Select Anniversary ❤️</span>
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <SwipeableCalendar 
                                                            viewDate={anniversaryViewDate} 
                                                            setViewDate={setAnniversaryViewDate} 
                                                            selected={field.value ? new Date(field.value) : undefined} 
                                                            onSelect={(d:any) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")} 
                                                            onClose={() => setIsAnniversaryOpen(false)} 
                                                        />
                                                    </DialogContent>
                                                )}
                                            </Dialog>
                                        </FormItem>
                                    )} />
                                </div>
                                <Button type="submit" className="w-full rounded-xl h-12 text-base shadow-lg shadow-primary/20" disabled={profileForm.formState.isSubmitting}>{profileForm.formState.isSubmitting ? "Saving..." : "Save Changes"}</Button>
                            </form>
                        </Form>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="h-px bg-gray-100 w-full mt-2 mb-4" />
        </div>

        {/* --- HORIZONTAL HIGHLIGHT SECTION --- */}
        <div className="mb-4 flex w-full gap-3 overflow-x-auto scrollbar-hide py-1">
            <div className="flex-1 bg-gradient-to-br from-amber-50 to-orange-100/50 border border-amber-100 p-3.5 rounded-2xl flex flex-col justify-center relative overflow-hidden group cursor-pointer" onClick={() => router.push('/account/wallet')}>
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet className="h-12 w-12 text-amber-600" /></div>
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm"><Wallet className="h-3.5 w-3.5 text-amber-600" /></div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Wallet</span>
                </div>
                <p className="text-lg font-bold text-gray-900">₹{walletBalance}</p>
                <p className="text-[10px] text-gray-500 font-medium">Available Balance</p>
            </div>
            
            <div onClick={() => router.push('/account/coupons')} className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100/50 border border-blue-100 p-3.5 rounded-2xl flex flex-col justify-center relative overflow-hidden group cursor-pointer">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><TicketPercent className="h-12 w-12 text-blue-600" /></div>
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm"><TicketPercent className="h-3.5 w-3.5 text-blue-600" /></div>
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">Coupons</span>
                </div>
                <p className="text-sm font-bold text-gray-900">View Offers</p>
                <p className="text-[10px] text-gray-500 font-medium">Save more on orders</p>
            </div>
        </div>

        {/* --- MENU LIST --- */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-1 pb-8"
        >
            <MenuItem icon={ShoppingBag} title="My Orders" subtitle="Track, Cancel and Return orders" href="/account/orders" />
            <MenuItem icon={MapPin} title="Addresses" subtitle="Save addresses for hassle-free checkout" href="/account/addresses" />
            <MenuItem icon={Wallet} title="My Wallet & Coins" subtitle="Check balance and transaction history" href="/account/wallet" />
            <MenuItem icon={TicketPercent} title="My Coupons" subtitle="View available coupons for you" href="/account/coupons" />

            <Sheet open={isSecurityOpen} onOpenChange={setIsSecurityOpen}>
                <SheetTrigger asChild>
                    <div className="w-full"><MenuItem icon={ShieldCheck} title="Login & Security" subtitle="Change password and security settings" /></div>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <SheetHeader className="mb-6"><SheetTitle>Change Password</SheetTitle></SheetHeader>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (<FormItem><FormLabel>Current Password</FormLabel><FormControl><div className="relative"><Input type={showPass.current ? "text" : "password"} {...field} className="rounded-xl h-11" /><button type="button" onClick={() => setShowPass(p => ({...p, current: !p.current}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>New Password</FormLabel><FormControl><div className="relative"><Input type={showPass.new ? "text" : "password"} {...field} className="rounded-xl h-11" /><button type="button" onClick={() => setShowPass(p => ({...p, new: !p.new}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (<FormItem><FormLabel>Confirm Password</FormLabel><FormControl><div className="relative"><Input type={showPass.confirm ? "text" : "password"} {...field} className="rounded-xl h-11" /><button type="button" onClick={() => setShowPass(p => ({...p, confirm: !p.confirm}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem>)} />
                            <Button type="submit" className="w-full rounded-xl h-12" disabled={passwordForm.formState.isSubmitting}>{passwordForm.formState.isSubmitting ? "Updating..." : "Update Password"}</Button>
                        </form>
                    </Form>
                </SheetContent>
            </Sheet>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <div className="w-full pt-2">
                        <MenuItem icon={LogOut} title="Log Out" subtitle="Sign out of your account" isDestructive />
                    </div>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl w-[90%] max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will be logged out of your account. You need to sign in again to access your orders.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={logout} className="rounded-xl bg-red-600 hover:bg-red-700">Log Out</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    </div>
  );
}