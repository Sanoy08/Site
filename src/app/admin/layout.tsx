// src/app/admin/layout.tsx

'use client';

import { useState, useEffect } from 'react';
import { Images } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Utensils, 
  TicketPercent, 
  Users, 
  Calendar, 
  ImageIcon, 
  Gift, 
  BarChart3, 
  Send, 
  Settings, 
  Menu, 
  Moon, 
  Sun,
  LogOut
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Loader2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

// ★★★ লিঙ্কগুলো আপডেট করা হয়েছে ( /admin বাদ দেওয়া হয়েছে ) ★★★
const adminNavLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard }, // /admin -> /
  { href: '/orders', label: 'Orders', icon: ShoppingBag }, // /admin/orders -> /orders
  { href: '/products', label: 'Menu Management', icon: Utensils },
  { href: '/coupons', label: 'Coupons', icon: TicketPercent },
  { href: '/users', label: 'Customers', icon: Users },
  { href: '/daily-menu', label: 'Daily Menu', icon: CalendarDays }, 
  { href: '/special-dates', label: 'Events Calendar', icon: Calendar },
  { href: '/hero-slides', label: 'Hero Section', icon: ImageIcon },
  { href: '/slider-images', label: 'Middle Slider', icon: Images },
  { href: '/offers', label: 'Offers Section', icon: Gift },
  { href: '/reports', label: 'Reports', icon: BarChart3 }, 
  { href: '/notifications', label: 'Push Notifications', icon: Send },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // ১. সার্ভার সাইড সিকিউরিটি চেক
  useEffect(() => {
    const verifyAdmin = async () => {
      // লগইন পেজ চেক করার দরকার নেই। খেয়াল করুন এখানেও '/login' ব্যবহার করা হয়েছে, '/admin/login' নয়
      if (pathname === '/login') {
        setIsChecking(false);
        setIsAuthorized(true);
        return;
      }

      const token = localStorage.getItem('token');

      if (!token) {
        // টোকেন না থাকলে লগইন পেজে পাঠান (সাবডোমেইন লজিক অনুযায়ী /login মানেই অ্যাডমিন লগইন)
        router.replace('/login');
        setIsChecking(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (res.ok && data.success && data.user.role === 'admin') {
          setIsAuthorized(true);
        } else {
          toast.error("Unauthorized: Admin Access Required");
          // মেইন ডোমেইনে ফেরত পাঠান
          window.location.href = 'https://www.bumbaskitchen.app';
        }
      } catch (error) {
        console.error("Admin verification failed", error);
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    };

    verifyAdmin();
  }, [pathname, router]);

  // ২. ডার্ক মোড
  useEffect(() => {
    const savedTheme = localStorage.getItem('adminTheme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('adminTheme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('adminTheme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (isChecking) {
    if (pathname === '/login') return <>{children}</>;
    return (
        <div className="h-screen w-full flex flex-col gap-4 items-center justify-center bg-muted/20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-slate-500 font-medium">Verifying Admin Privileges...</p>
        </div>
    );
  }

  if (pathname === '/login') {
      return <>{children}</>;
  }

  if (!isAuthorized) return null;

  const displayUser = user || { name: 'Admin', role: 'admin', picture: '' };
  
  // টাইটেল বের করার লজিক আপডেট
  const currentTitle = adminNavLinks.find(link => link.href === pathname)?.label || 'Admin Panel';

  return (
    <div className={`min-h-screen flex bg-[#f0f2f5] dark:bg-[#121212] transition-colors duration-300 font-sans`}>
      
      {/* --- SIDEBAR --- */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[260px] bg-[#2c3e50] text-[#ecf0f1] shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-none flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-center gap-3 border-b border-white/10 px-4">
           <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#2c3e50] font-bold">BK</div>
           <h3 className="text-xl font-semibold font-serif tracking-wide">Bumba's Kitchen</h3>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3 custom-scrollbar">
          {adminNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 rounded-lg transition-all duration-200 group cursor-pointer",
                  isActive 
                    ? "bg-[#4CAF50] text-white font-medium border-l-4 border-[#FFB300]" 
                    : "text-[#ecf0f1] hover:bg-[#34495e] hover:text-white hover:pl-6 border-l-4 border-transparent"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-[#bdc3c7] group-hover:text-[#C8E6C9]")} />
                <span className="text-[0.95rem]">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-[#243342]">
            <button 
                onClick={() => { logout(); router.push('/login'); }} // লগআউট হলে /login এ যাবে (যা আসলে /admin/login)
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white transition-all duration-300"
            >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
            </button>
            <p className="text-center text-xs text-[#7f8c8d] mt-3">&copy; {new Date().getFullYear()} Bumba's Kitchen</p>
        </div>
      </aside>

      {/* --- MOBILE OVERLAY --- */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-[#1e1e1e] shadow-sm flex items-center justify-between px-6 sticky top-0 z-30 transition-colors duration-300">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-[#2c3e50] dark:text-[#e5e7eb] truncate">{currentTitle}</h1>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
                <div 
                    onClick={toggleTheme}
                    className="w-14 h-7 bg-[#ccc] dark:bg-[#4A5568] rounded-full relative cursor-pointer flex items-center justify-between px-1.5 transition-colors duration-300"
                >
                    <Moon className="w-3.5 h-3.5 text-[#f1c40f] z-10" />
                    <Sun className="w-3.5 h-3.5 text-[#f39c12] z-10" />
                    <div className={cn(
                        "absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300",
                        isDarkMode ? "translate-x-7" : "translate-x-0"
                    )} />
                </div>

                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-[#4CAF50] shadow-sm cursor-pointer">
                        <AvatarImage src={displayUser.picture} />
                        <AvatarFallback className="bg-[#C8E6C9] text-[#2c3e50] font-bold">
                            {displayUser.name?.charAt(0) || 'A'}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block font-medium text-[#2c3e50] dark:text-[#e5e7eb]">
                        {displayUser.name}
                    </span>
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
}