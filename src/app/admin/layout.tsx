// src/app/admin/layout.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingBag, Utensils, TicketPercent, Users, 
  Calendar, ImageIcon, Gift, BarChart3, Send, Settings, Menu, Moon, Sun, LogOut, CalendarDays, FileText, Loader2,ImagePlus , Images, X 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/hooks/use-auth'; 
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import AdminPushSetup from "@/components/admin/AdminPushSetup";

const adminNavLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: "/custom-invoice", label: "Custom Invoice", icon: FileText },
  { href: "/poster-maker", label: "Poster Maker", icon: ImagePlus  },
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
  const { user, isLoading, logout } = useAuth(); 
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ১. Security Check & Redirect Logic
  useEffect(() => {
    if (isLoading || !isMounted) return; 

    if (!user) {
        window.location.href = 'https://bumbaskitchen.app/login';
        return;
    } 
    
    if (user.role !== 'admin') {
        toast.error("Unauthorized: Admin Access Required");
        window.location.href = 'https://bumbaskitchen.app'; 
    }
  }, [user, isLoading, isMounted]);

  // ২. Dark Mode Logic
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

  // মোবাইলে সাইডবার খুললে পেছনের স্ক্রল বন্ধ করার লজিক
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isSidebarOpen]);

  // Loading State UI
  if (isLoading || !isMounted) {
    return (
        <div className="h-screen w-full flex flex-col gap-4 items-center justify-center bg-[#f0f2f5] dark:bg-[#121212]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-slate-500 font-medium">Verifying Admin Access...</p>
        </div>
    );
  }

  // Block rendering if unauthorized
  if (!user || user.role !== 'admin') return null;

  const currentTitle = adminNavLinks.find(link => link.href === pathname)?.label || 'Admin Panel';

  return (
    <div className="min-h-screen flex bg-[#f0f2f5] dark:bg-[#121212] transition-colors duration-300 font-sans">
      
      {/* ★★★ 1. Mobile Backdrop (Overlay) ★★★ */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ★★★ 2. Sidebar ★★★ */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-[#2c3e50] text-[#ecf0f1] shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between lg:justify-center gap-3 border-b border-white/10 px-4 shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#2c3e50] font-bold shadow-sm">BK</div>
              <h3 className="text-xl font-semibold font-serif tracking-wide truncate">Bumba's Kitchen</h3>
           </div>
           {/* ★ Mobile Close Button ★ */}
           <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="lg:hidden p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
             <X className="w-5 h-5" />
           </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 space-y-1.5 px-3 custom-scrollbar">
          {adminNavLinks.map((link) => {
            const Icon = link.icon;
            // ★ Smart Active Link Logic
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            
            return (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                  isActive 
                    ? "bg-[#4CAF50] text-white font-semibold shadow-md border-l-4 border-[#FFB300]" 
                    : "text-[#bdc3c7] hover:bg-[#34495e] hover:text-white border-l-4 border-transparent"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform duration-200", isActive ? "text-white scale-110" : "group-hover:text-[#C8E6C9]")} />
                <span className="text-[0.95rem] tracking-wide">{link.label}</span>
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-white/10 bg-[#243342] shrink-0">
            <button onClick={logout} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300">
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-semibold tracking-wide">Logout</span>
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-[#1e1e1e] shadow-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-colors duration-300 shrink-0">
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2c2c2c] rounded-xl transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-lg sm:text-xl font-bold text-[#2c3e50] dark:text-[#e5e7eb] truncate">
                  {currentTitle}
                </h1>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-6">
                <a href="https://bumbaskitchen.app" target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors">
                    <ShoppingBag className="w-4 h-4" />
                    Visit Store
                </a>

                 <div onClick={toggleTheme} className="w-14 h-7 bg-[#ccc] dark:bg-[#4A5568] rounded-full relative cursor-pointer flex items-center justify-between px-1.5 transition-colors duration-300">
                    <Moon className="w-3.5 h-3.5 text-[#f1c40f] z-10" />
                    <Sun className="w-3.5 h-3.5 text-[#f39c12] z-10" />
                    <div className={cn("absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300", isDarkMode ? "translate-x-7" : "translate-x-0")} />
                </div>
                <div className="flex items-center gap-3 pl-2 sm:pl-0 border-l sm:border-0 border-gray-200 dark:border-gray-700">
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-[#4CAF50] shadow-sm cursor-pointer">
                        <AvatarImage src={user.picture} />
                        <AvatarFallback className="bg-[#C8E6C9] text-[#2c3e50] font-bold">{user.name?.charAt(0) || 'A'}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block font-medium text-[#2c3e50] dark:text-[#e5e7eb] truncate max-w-[120px]">
                      {user.name}
                    </span>
                </div>
            </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AdminPushSetup />
                {children}
            </div>
        </main>
      </div>
    </div>
  );
}
