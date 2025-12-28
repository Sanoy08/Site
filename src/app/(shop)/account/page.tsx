// src/app/(shop)/account/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Loader2, Cake, Heart, Lock, Eye, EyeOff, User, 
  Mail, ShieldCheck, Save, Sparkles, LogOut, CalendarIcon 
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { NotificationPermission } from '@/components/shared/NotificationPermission';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// --- IMPORTS FOR CALENDAR & ANIMATION ---
import { Calendar } from "@/components/ui/calendar";
import { format, setMonth, setYear, getMonth, getYear, addMonths, subMonths } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence, PanInfo } from "framer-motion";

const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  lastName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email(),
  dob: z.string().optional(),
  anniversary: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, { message: "Current password is required." }),
    newPassword: z.string().min(8, { message: "New password must be at least 8 characters." }),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match.",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// --- CONSTANTS ---
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => currentYear - i);

// --- ANIMATION VARIANTS ---
const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
};

// --- REUSABLE SWIPEABLE CALENDAR COMPONENT ---
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
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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


export default function AccountProfilePage() {
  const { user, login, logout } = useAuth();
  
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Modal Open States
  const [isDobOpen, setIsDobOpen] = useState(false);
  const [isAnniversaryOpen, setIsAnniversaryOpen] = useState(false);

  // Calendar View States
  const [dobViewDate, setDobViewDate] = useState<Date>(new Date("2000-01-01"));
  const [anniversaryViewDate, setAnniversaryViewDate] = useState<Date>(new Date());

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { firstName: '', lastName: '', email: '', dob: '', anniversary: '' },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
  });

  useEffect(() => {
    const fetchLatestData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.user) {
                    login(data.user, token);
                }
            }
        } catch (error) {
            console.error("Failed to sync profile", error);
        }
    };
    fetchLatestData();
  }, []);

  useEffect(() => {
    if (user) {
      const nameParts = user.name?.split(' ') || ['', ''];
      // @ts-ignore
      const userDob = user.dob || '';
      // @ts-ignore
      const userAnniversary = user.anniversary || '';

      profileForm.reset({
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        email: user.email || '',
        dob: userDob,
        anniversary: userAnniversary,
      });

      if (userDob) setDobViewDate(new Date(userDob));
      if (userAnniversary) setAnniversaryViewDate(new Date(userAnniversary));
    }
  }, [user, profileForm]);

  useEffect(() => {
    if (isDobOpen || isAnniversaryOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isDobOpen, isAnniversaryOpen]);

  async function onProfileSubmit(data: ProfileFormValues) {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            dob: data.dob,
            anniversary: data.anniversary
        }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Failed to update profile');
      
      login(responseData.user, token || '');
      toast.success(responseData.message);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile.');
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            }),
        });
        const responseData = await res.json();
        if (!res.ok) throw new Error(responseData.error || 'Failed to change password');
        toast.success(responseData.message);
        passwordForm.reset();
    } catch (error: any) {
        toast.error(error.message || 'Failed to change password.');
    }
  }

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
  
  const { isSubmitting: isProfileSubmitting } = profileForm.formState;
  const { isSubmitting: isPasswordSubmitting } = passwordForm.formState;

  // @ts-ignore
  const hasDob = !!user?.dob && user.dob !== "";
  // @ts-ignore
  const hasAnniversary = !!user?.anniversary && user.anniversary !== "";

  if (!user) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      
      {/* --- HEADER SECTION (Refined) --- */}
      <div className="bg-white border-b border-gray-100 pt-10 pb-16 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
         <div className="container relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                <Avatar className="h-28 w-28 border-4 border-white shadow-xl ring-1 ring-gray-100">
                    <AvatarImage src={user?.picture || ''} alt={user?.name || ''} />
                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-orange-600 text-white">
                        {getInitials(user.name)}
                    </AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left mb-2 flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Hello, {user.name.split(' ')[0]}! 👋</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage your personal info, security, and preferences.</p>
                </div>
                <div className="flex gap-3">
                    <NotificationPermission />
                    <Button variant="outline" onClick={logout} className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white shadow-sm">
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                </div>
            </div>
         </div>
      </div>

      <div className="container -mt-8 relative z-20">
        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* --- LEFT: PROFILE FORM (Clean Card Style) --- */}
            {/* ★★★ FIX: Changed shadow-lg to shadow-sm, removed overflow-hidden for cleaner look ★★★ */}
            <Card className="lg:col-span-2 shadow-sm border border-gray-200 bg-white rounded-2xl">
                <CardHeader className="pb-0 pt-6 px-6 md:px-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><User className="h-5 w-5" /></div>
                        <div>
                            <CardTitle className="text-xl font-bold text-gray-900">Personal Information</CardTitle>
                            <CardDescription className="text-gray-500">Update your personal details here.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="p-6 md:p-8 space-y-6">
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormField control={profileForm.control} name="firstName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700 font-medium">First Name</FormLabel>
                                        <FormControl><Input placeholder="John" {...field} className="h-12 bg-white border-gray-200 focus:border-primary focus:ring-primary/20 rounded-xl" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={profileForm.control} name="lastName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700 font-medium">Last Name</FormLabel>
                                        <FormControl><Input placeholder="Doe" {...field} className="h-12 bg-white border-gray-200 focus:border-primary focus:ring-primary/20 rounded-xl" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={profileForm.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">Email Address</FormLabel>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <FormControl>
                                            <Input placeholder="email@example.com" {...field} disabled className="pl-10 h-12 bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200 rounded-xl" />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Special Dates Section - Slightly distinct but integrated */}
                            <div className="p-6 bg-gradient-to-br from-amber-50/80 to-orange-50/50 rounded-2xl border border-amber-100 space-y-5">
                                <div className="flex items-center gap-2 text-amber-900 font-bold pb-2 border-b border-amber-200/50">
                                    <Sparkles className="h-4 w-4 text-amber-600" /> Special Dates 
                                    <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full ml-auto">
                                        Exclusive Offers
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    
                                    <FormField control={profileForm.control} name="dob" render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                                                <Cake className="h-3.5 w-3.5 text-pink-500" /> Birthday {hasDob && <Lock className="h-3 w-3 ml-auto opacity-40" />}
                                            </FormLabel>
                                            
                                            <Dialog open={isDobOpen} onOpenChange={setIsDobOpen}>
                                                <DialogTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            disabled={hasDob}
                                                            variant={"outline"}
                                                            className={cn(
                                                                "h-12 w-full pl-3 text-left font-normal border-amber-200/60 bg-white hover:bg-amber-50/50 hover:border-amber-300 transition-all rounded-xl shadow-sm hover:shadow-md",
                                                                !field.value && "text-gray-400",
                                                                hasDob && "bg-gray-50 opacity-70 cursor-not-allowed border-dashed shadow-none"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                <span className="font-semibold text-gray-900">{format(new Date(field.value), "MMMM do, yyyy")}</span>
                                                            ) : (
                                                                <span>Pick your birthday</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 text-amber-500" />
                                                        </Button>
                                                    </FormControl>
                                                </DialogTrigger>
                                                
                                                {!hasDob && (
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
                                                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                                            onClose={() => setIsDobOpen(false)}
                                                        />
                                                    </DialogContent>
                                                )}
                                            </Dialog>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={profileForm.control} name="anniversary" render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                                                <Heart className="h-3.5 w-3.5 text-red-500" /> Anniversary {hasAnniversary && <Lock className="h-3 w-3 ml-auto opacity-40" />}
                                            </FormLabel>
                                            
                                            <Dialog open={isAnniversaryOpen} onOpenChange={setIsAnniversaryOpen}>
                                                <DialogTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            disabled={hasAnniversary}
                                                            variant={"outline"}
                                                            className={cn(
                                                                "h-12 w-full pl-3 text-left font-normal border-amber-200/60 bg-white hover:bg-amber-50/50 hover:border-amber-300 transition-all rounded-xl shadow-sm hover:shadow-md",
                                                                !field.value && "text-gray-400",
                                                                hasAnniversary && "bg-gray-50 opacity-70 cursor-not-allowed border-dashed shadow-none"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                <span className="font-semibold text-gray-900">{format(new Date(field.value), "MMMM do, yyyy")}</span>
                                                            ) : (
                                                                <span>Pick anniversary date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 text-amber-500" />
                                                        </Button>
                                                    </FormControl>
                                                </DialogTrigger>
                                                
                                                {!hasAnniversary && (
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
                                                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                                            onClose={() => setIsAnniversaryOpen(false)}
                                                        />
                                                    </DialogContent>
                                                )}
                                            </Dialog>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={isProfileSubmitting} className="min-w-[140px] h-12 text-base shadow-lg shadow-primary/20 rounded-xl bg-primary hover:bg-primary/90">
                                    {isProfileSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* --- RIGHT: SECURITY FORM (Clean Card Style) --- */}
            {/* ★★★ FIX: Consistent styling with Profile Card ★★★ */}
            <Card className="shadow-sm border border-gray-200 bg-white rounded-2xl h-fit sticky top-24">
                <CardHeader className="pb-0 pt-6 px-6 md:px-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><ShieldCheck className="h-5 w-5" /></div>
                        <div>
                            <CardTitle className="text-xl font-bold text-gray-900">Security</CardTitle>
                            <CardDescription className="text-gray-500">Update your password.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
                            <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">Current Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showCurrentPass ? "text" : "password"} {...field} className="pr-10 h-12 bg-white border-gray-200 rounded-xl focus:border-primary" />
                                            <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <Separator className="bg-gray-100" />

                            <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showNewPass ? "text" : "password"} {...field} className="pr-10 h-12 bg-white border-gray-200 rounded-xl focus:border-primary" />
                                            <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">Confirm Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showConfirmPass ? "text" : "password"} {...field} className="pr-10 h-12 bg-white border-gray-200 rounded-xl focus:border-primary" />
                                            <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <Button type="submit" variant="outline" disabled={isPasswordSubmitting} className="w-full h-12 mt-2 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700">
                                {isPasswordSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
}