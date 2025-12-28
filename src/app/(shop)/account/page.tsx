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

// --- IMPORTS FOR CALENDAR ---
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

export default function AccountProfilePage() {
  const { user, login, logout } = useAuth();
  
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Modal Open States
  const [isDobOpen, setIsDobOpen] = useState(false);
  const [isAnniversaryOpen, setIsAnniversaryOpen] = useState(false);

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
      })
    }
  }, [user, profileForm]);

  // Prevent Body Scroll Effect
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

  const currentYear = new Date().getFullYear();
  const fromYear = currentYear - 100;
  const toYear = currentYear;

  if (!user) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="bg-gray-50/50 min-h-screen pb-20">
      
      <div className="bg-white border-b pt-10 pb-16 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
         <div className="container relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                    <AvatarImage src={user?.picture || ''} alt={user?.name || ''} />
                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-orange-600 text-white">
                        {getInitials(user.name)}
                    </AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left mb-2 flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">Hello, {user.name.split(' ')[0]}! 👋</h1>
                    <p className="text-muted-foreground mt-1">Manage your personal info, security, and preferences.</p>
                </div>
                <div className="flex gap-3">
                    <NotificationPermission />
                    <Button variant="outline" onClick={logout} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                </div>
            </div>
         </div>
      </div>

      <div className="container -mt-8 relative z-20">
        <div className="grid lg:grid-cols-3 gap-8">
            
            <Card className="lg:col-span-2 shadow-lg border-0 overflow-hidden">
                <CardHeader className="bg-white border-b pb-6">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User className="h-5 w-5" /></div>
                        Personal Information
                    </CardTitle>
                    <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={profileForm.control} name="firstName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl><Input placeholder="John" {...field} className="h-12 bg-gray-50/50" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={profileForm.control} name="lastName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl><Input placeholder="Doe" {...field} className="h-12 bg-gray-50/50" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={profileForm.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <FormControl>
                                            <Input placeholder="email@example.com" {...field} disabled className="pl-10 h-12 bg-gray-100 text-muted-foreground cursor-not-allowed border-transparent" />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl border border-amber-100 space-y-6">
                                <div className="flex items-center gap-2 text-amber-900 font-semibold pb-3 border-b border-amber-200/60">
                                    <div className="p-1.5 bg-amber-100 rounded-md"><Sparkles className="h-4 w-4 text-amber-600" /></div>
                                    Special Dates 
                                    <span className="text-[10px] font-normal text-amber-700 bg-amber-100/50 px-2 py-0.5 rounded-full ml-auto border border-amber-200">
                                        ✨ Get exclusive offers
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    
                                    {/* Birthday Field */}
                                    <FormField control={profileForm.control} name="dob" render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
                                                <Cake className="h-3.5 w-3.5 text-pink-500" /> Birthday {hasDob && <Lock className="h-3 w-3 ml-auto opacity-50" />}
                                            </FormLabel>
                                            
                                            <Dialog open={isDobOpen} onOpenChange={setIsDobOpen}>
                                                <DialogTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            disabled={hasDob}
                                                            variant={"outline"}
                                                            className={cn(
                                                                "h-12 w-full pl-3 text-left font-normal border-amber-200/60 bg-white hover:bg-amber-50/50 hover:border-amber-300 transition-all rounded-xl shadow-sm",
                                                                !field.value && "text-muted-foreground",
                                                                hasDob && "bg-gray-50 opacity-60 cursor-not-allowed border-dashed"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                <span className="font-medium text-gray-900">{format(new Date(field.value), "MMMM do, yyyy")}</span>
                                                            ) : (
                                                                <span>Pick your birthday</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 text-amber-500 opacity-80" />
                                                        </Button>
                                                    </FormControl>
                                                </DialogTrigger>
                                                
                                                {!hasDob && (
                                                    <DialogContent className="w-auto p-0 rounded-2xl overflow-hidden border-0 shadow-2xl">
                                                        <DialogHeader className="p-4 bg-amber-50/50 border-b border-amber-100">
                                                            <DialogTitle className="text-center text-amber-900 flex flex-col items-center gap-1">
                                                                <span>Select Your Birthday 🎂</span>
                                                                <span className="text-xs font-normal text-muted-foreground">We'll send you a gift!</span>
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="p-4 flex justify-center bg-white">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value ? new Date(field.value) : undefined}
                                                                onSelect={(date) => {
                                                                    field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                                                                    setIsDobOpen(false);
                                                                }}
                                                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                                initialFocus
                                                                captionLayout="dropdown-buttons"
                                                                fromYear={fromYear} 
                                                                toYear={toYear}
                                                                className="rounded-md"
                                                                classNames={{
                                                                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                                                    month: "space-y-4",
                                                                    caption: "flex justify-center pt-1 relative items-center",
                                                                    caption_label: "hidden",
                                                                    caption_dropdowns: "flex justify-center gap-2 mb-2 w-full",
                                                                    // ★★★ NAV HIDDEN HERE ★★★
                                                                    nav: "hidden", 
                                                                    table: "w-full border-collapse space-y-1",
                                                                    head_row: "flex",
                                                                    head_cell: "text-muted-foreground rounded-md w-12 font-normal text-[0.8rem] h-10 flex items-center justify-center",
                                                                    row: "flex w-full mt-2",
                                                                    cell: "h-12 w-12 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                                                    day: "h-12 w-12 p-0 font-normal aria-selected:opacity-100 hover:bg-amber-100 rounded-lg transition-colors",
                                                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold shadow-md",
                                                                    day_today: "bg-amber-50 text-amber-900 font-bold border border-amber-200",
                                                                    day_outside: "text-muted-foreground opacity-50",
                                                                    day_disabled: "text-muted-foreground opacity-50",
                                                                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                                                    day_hidden: "invisible",
                                                                    dropdown: "bg-background border border-amber-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer hover:bg-amber-50 shadow-sm",
                                                                    dropdown_month: "flex-1",
                                                                    dropdown_year: "flex-1",
                                                                }}
                                                            />
                                                        </div>
                                                    </DialogContent>
                                                )}
                                            </Dialog>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {/* Anniversary Field */}
                                    <FormField control={profileForm.control} name="anniversary" render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
                                                <Heart className="h-3.5 w-3.5 text-red-500" /> Anniversary {hasAnniversary && <Lock className="h-3 w-3 ml-auto opacity-50" />}
                                            </FormLabel>
                                            
                                            <Dialog open={isAnniversaryOpen} onOpenChange={setIsAnniversaryOpen}>
                                                <DialogTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            disabled={hasAnniversary}
                                                            variant={"outline"}
                                                            className={cn(
                                                                "h-12 w-full pl-3 text-left font-normal border-amber-200/60 bg-white hover:bg-amber-50/50 hover:border-amber-300 transition-all rounded-xl shadow-sm",
                                                                !field.value && "text-muted-foreground",
                                                                hasAnniversary && "bg-gray-50 opacity-60 cursor-not-allowed border-dashed"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                <span className="font-medium text-gray-900">{format(new Date(field.value), "MMMM do, yyyy")}</span>
                                                            ) : (
                                                                <span>Pick anniversary date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 text-amber-500 opacity-80" />
                                                        </Button>
                                                    </FormControl>
                                                </DialogTrigger>
                                                
                                                {!hasAnniversary && (
                                                    <DialogContent className="w-auto p-0 rounded-2xl overflow-hidden border-0 shadow-2xl">
                                                        <DialogHeader className="p-4 bg-amber-50/50 border-b border-amber-100">
                                                            <DialogTitle className="text-center text-amber-900 flex flex-col items-center gap-1">
                                                                <span>Select Anniversary ❤️</span>
                                                                <span className="text-xs font-normal text-muted-foreground">Celebrate with us!</span>
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="p-4 flex justify-center bg-white">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value ? new Date(field.value) : undefined}
                                                                onSelect={(date) => {
                                                                    field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                                                                    setIsAnniversaryOpen(false);
                                                                }}
                                                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                                initialFocus
                                                                captionLayout="dropdown-buttons"
                                                                fromYear={fromYear} 
                                                                toYear={toYear}
                                                                className="rounded-md"
                                                                classNames={{
                                                                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                                                    month: "space-y-4",
                                                                    caption: "flex justify-center pt-1 relative items-center",
                                                                    caption_label: "hidden",
                                                                    caption_dropdowns: "flex justify-center gap-2 mb-2 w-full",
                                                                    // ★★★ NAV HIDDEN HERE ★★★
                                                                    nav: "hidden", 
                                                                    table: "w-full border-collapse space-y-1",
                                                                    head_row: "flex",
                                                                    head_cell: "text-muted-foreground rounded-md w-12 font-normal text-[0.8rem] h-10 flex items-center justify-center", 
                                                                    row: "flex w-full mt-2",
                                                                    cell: "h-12 w-12 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20", 
                                                                    day: "h-12 w-12 p-0 font-normal aria-selected:opacity-100 hover:bg-amber-100 rounded-lg transition-colors", 
                                                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold shadow-md",
                                                                    day_today: "bg-amber-50 text-amber-900 font-bold border border-amber-200",
                                                                    dropdown: "bg-background border border-amber-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer hover:bg-amber-50 shadow-sm",
                                                                    dropdown_month: "flex-1",
                                                                    dropdown_year: "flex-1",
                                                                }}
                                                            />
                                                        </div>
                                                    </DialogContent>
                                                )}
                                            </Dialog>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={isProfileSubmitting} className="min-w-[140px] h-12 text-base shadow-lg shadow-primary/20">
                                    {isProfileSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-0 h-fit sticky top-24">
                <CardHeader className="bg-white border-b pb-6">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><ShieldCheck className="h-5 w-5" /></div>
                        Security
                    </CardTitle>
                    <CardDescription>Update your password.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showCurrentPass ? "text" : "password"} {...field} className="pr-10 h-11" />
                                            <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <Separator />

                            <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showNewPass ? "text" : "password"} {...field} className="pr-10 h-11" />
                                            <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showConfirmPass ? "text" : "password"} {...field} className="pr-10 h-11" />
                                            <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <Button type="submit" variant="outline" disabled={isPasswordSubmitting} className="w-full h-11 mt-2">
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