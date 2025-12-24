// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const path = request.nextUrl.pathname;
  
  // কুকি থেকে টোকেন নেওয়া
  const token = request.cookies.get('token')?.value || '';

  // ১. API এবং Static ফাইল ইগনোর করা (Cleaned up logic)
  if (path.startsWith('/_next/') || 
      path.endsWith('.ico') || 
      path.startsWith('/api/') ||
      path.startsWith('/images/') || // ইমেজ ফোল্ডার
      path.startsWith('/icons/')     // আইকন ফোল্ডার
      ) {
    return NextResponse.next();
  }

  // ২. পাবলিক পাথ ডিফাইন করা (যেখানে লগইন ছাড়াই যাওয়া যাবে)
  const isPublicPath = 
      path === '/login' || 
      path === '/register' || 
      path === '/verify-otp' || 
      path === '/delivery/login';

  // ৩. ★ ডেলিভারি অ্যাপ প্রোটেকশন (Delivery Route Protection) ★
  if (path.startsWith('/delivery') && path !== '/delivery/login') {
    if (!token) {
      // টোকেন না থাকলে ডেলিভারি লগইনে রিডাইরেক্ট
      return NextResponse.redirect(new URL('/delivery/login', request.url));
    }
  }

  // ৪. যদি ইউজার অলরেডি লগইন থাকে এবং পাবলিক পেজে (Login/Register) যেতে চায়
  if (token && isPublicPath) {
    // যদি ডেলিভারি লগইন পেজে থাকে, তবে ডেলিভারি ড্যাশবোর্ডে পাঠাও
    if (path === '/delivery/login') {
      return NextResponse.redirect(new URL('/delivery', request.url));
    }
    // অন্যথায় হোমপেজে
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ৫. সাধারণ প্রোটেকশন (Account/Admin পাথ - মেইন ডোমেইনের জন্য)
  if (!isPublicPath && !token && (path.startsWith('/account') || path.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ৬. সাবডোমেইন হ্যান্ডলিং (আপনার আগের লজিক)
  if (!hostname) return NextResponse.next();
  
  const isSubdomain = hostname.startsWith('admin.'); 

  if (isSubdomain && !path.startsWith('/admin')) {
      const newPath = `/admin${path}`;
      return NextResponse.rewrite(new URL(newPath, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/((?!_next/static|favicon.ico|.*\\..*).*)',
  ],
};