// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretStr = process.env.JWT_SECRET;
if (!secretStr) throw new Error('JWT_SECRET is missing!');
const JWT_SECRET = new TextEncoder().encode(secretStr);

// 🌟 যেসব পেজে লগইন ছাড়াই ঢোকা যাবে (Public Routes)
const publicPaths = ['/login', '/register', '/signup', '/web'];

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const path = url.pathname;
  
  // স্ট্যাটিক ফাইল (ছবি, ফন্ট, .apk) ও API রুট ইগনোর করো
  if (path.startsWith('/_next/') || path.includes('.') || path.startsWith('/api/')) {
    return NextResponse.next();
  }

  const isAdminDomain = hostname.startsWith('admin.');
  const token = request.cookies.get('auth_token')?.value;
  let userRole = '';
  
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userRole = (payload.role as string) || 'customer';
    } catch (e) {
      // টোকেন এক্সপায়ার হলে বা ভুল হলে
    }
  }

  const isPublicPath = publicPaths.some(p => path.startsWith(p));

  // ==========================================
  // ★ FORCE LOGIN LOGIC (সবার জন্য বাধ্যতামূলক)
  // ==========================================
  
  // ১. যদি ইউজার লগইন না থাকে এবং সে পাবলিক পেজে না থাকে -> সোজা লগইন পেজে পাঠাও
  if (!token && !isPublicPath) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
  }

  // ২. যদি লগইন করা থাকে, আর সে আবার /login পেজে যেতে চায় -> তাকে হোমপেজে পাঠিয়ে দাও
  if (token && (path === '/login' || path === '/register' || path === '/signup')) {
      if (isAdminDomain && userRole === 'admin') {
          return NextResponse.redirect(new URL('/', request.url));
      } else {
          return NextResponse.redirect(new URL('/', request.url));
      }
  }

  // ==========================================
  // CASE 1: অ্যাডমিন ডোমেইন সুরক্ষা (admin.bumbaskitchen.app)
  // ==========================================
  if (isAdminDomain) {
    // লগইন আছে কিন্তু অ্যাডমিন না -> মেইন ডোমেইনের হোমে পাঠিয়ে দাও
    if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/', 'https://bumbaskitchen.app'));
    }

    // URL Rewrite (ফোল্ডার ম্যাপ করা)
    if (path.startsWith('/admin')) {
        const newPath = path.replace(/^\/admin/, '') || '/';
        return NextResponse.redirect(new URL(newPath, request.url));
    }
    return NextResponse.rewrite(new URL(`/admin${path === '/' ? '' : path}`, request.url));
  }

  // ==========================================
  // CASE 2: মেইন ডোমেইন (www.bumbaskitchen.app)
  // ==========================================
  if (!isAdminDomain) {
    // মেইন ডোমেইনে কেউ /admin এ এক্সেস করতে চাইলে 404 দেখাও (সিকিউরিটি)
    if (path.startsWith('/admin')) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // যেসব রুটে মিডলওয়্যার চলবে না
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};