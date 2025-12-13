// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

// ১. যে রাউটগুলো প্রোটেক্টেড (লগইন ছাড়া দেখা যাবে না)
const protectedRoutes = ['/account', '/checkout', '/orders'];

// ২. যে রাউটগুলো লগইন করা থাকলে দেখার দরকার নেই
const authRoutes = ['/login', '/register', '/verify-otp', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const path = request.nextUrl.pathname;

  // ৩. স্ট্যাটিক ফাইল এবং API রাউটগুলো মিডলওয়্যার লজিক থেকে বাদ দেওয়া হলো
  if (path.startsWith('/_next/') || 
      path.endsWith('.ico') || 
      path.startsWith('/api/') ||
      path.includes('.') // ফাইল এক্সটেনশন থাকলে স্কিপ করবে
     ) {
    return NextResponse.next();
  }

  // ৪. সেশন কুকি চেক এবং ডিক্রিপ্ট করা
  const cookie = request.cookies.get('session_token')?.value;
  const session = cookie ? await decrypt(cookie) : null;

  // ৫. সাবডোমেইন চেক (আপনার পুরনো লজিক)
  const isSubdomain = hostname?.startsWith('admin.');

  // ============================================================
  // AUTHENTICATION & AUTHORIZATION LOGIC
  // ============================================================

  // A. Admin Route Protection
  // যদি ইউজার 'admin' সাবডোমেইনে থাকে অথবা '/admin' পাথ এ ভিজিট করে
  if (isSubdomain || path.startsWith('/admin')) {
      // লগইন পেজ কিনা চেক করা (সাবডোমেইনে '/login' মানে আসলে '/admin/login')
      const isAdminLogin = path === '/login' || path.startsWith('/admin/login');

      if (!session?.userId) {
          // ক) লগইন করা নেই
          if (!isAdminLogin) {
             // লগইন পেজে রিডাইরেক্ট করো
             const url = new URL('/login', request.url);
             // যদি সাবডোমেইনে না থাকে, তবে '/admin/login' এ পাঠাও
             if (!isSubdomain) url.pathname = '/admin/login'; 
             return NextResponse.redirect(url);
          }
      } else if (session.role !== 'admin') {
          // খ) লগইন করা আছে কিন্তু অ্যাডমিন না -> হোমপেজে কিক দাও
          return NextResponse.redirect(new URL('/', request.url));
      } else {
          // গ) অ্যাডমিন হিসেবে লগইন করা আছে
          if (isAdminLogin) {
              // লগইন করা অবস্থায় আবার লগইন পেজে গেলে ড্যাশবোর্ডে পাঠাও
              return NextResponse.redirect(new URL('/', request.url));
          }
      }
  }

  // B. Customer Protected Routes
  // সাধারণ ইউজার যদি অ্যাকাউন্ট বা চেকআউটে যেতে চায়
  else if (protectedRoutes.some(route => path.startsWith(route))) {
      if (!session?.userId) {
          // লগইন নেই -> লগইন পেজে পাঠাও (সাথে রিডাইরেক্ট ইউআরএল)
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('redirect', path);
          return NextResponse.redirect(loginUrl);
      }
  }

  // C. Auth Routes Redirect
  // লগইন করা ইউজার যদি আবার লগইন/রেজিস্টারে যেতে চায়
  else if (authRoutes.some(route => path.startsWith(route))) {
      if (session?.userId) {
          return NextResponse.redirect(new URL('/account', request.url));
      }
  }

  // ============================================================
  // REWRITE LOGIC (আপনার পুরনো কোড)
  // ============================================================
  
  // অ্যাডমিন সাবডোমেইনকে '/admin' পাথে রিরাইট করা
  if (isSubdomain && !path.startsWith('/admin')) {
      const newPath = `/admin${path}`;
      return NextResponse.rewrite(new URL(newPath, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  // আগের মতোই রাখা হয়েছে, তবে একটু অপ্টিমাইজড
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};