// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretStr = process.env.JWT_SECRET;
if (!secretStr) throw new Error('JWT_SECRET is missing!');
const JWT_SECRET = new TextEncoder().encode(secretStr);

// 🌟 যেসব পেজে লগইন ছাড়াই ঢোকা যাবে (Public Routes) – মূল ডোমেইনের জন্য
const publicPaths = ['/login', '/register', '/signup', '/web'];

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const path = url.pathname;
  
  // স্ট্যাটিক ফাইল (ছবি, ফন্ট, .apk) ইগনোর করো
  if (path.startsWith('/_next/') || path.includes('.')) {
    return NextResponse.next();
  }

  // ==========================================
  // ★ API BLOCKER: ব্রাউজার থেকে সরাসরি এক্সেস বন্ধ
  // ==========================================
  if (path.startsWith('/api/')) {
    const acceptHeader = request.headers.get('accept') || '';
    if (request.method === 'GET' && acceptHeader.includes('text/html')) {
        return NextResponse.rewrite(new URL('/404', request.url));
    }
    return NextResponse.next();
  }

  const isAdminDomain = hostname.startsWith('admin.');

  // ==========================================
  // ★ NATIVE APP GUARD: ব্রাউজার ব্লক লজিক ★
  // ==========================================
  const userAgent = request.headers.get('user-agent') || '';
  const isNativeApp = userAgent.includes('BumbasKitchenApp-Native');
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  // শুধুমাত্র মেইন ডোমেইনে এই গার্ড কাজ করবে (অ্যাডমিন ডোমেইন বাদ)
  if (!isAdminDomain && !isNativeApp && !isLocalhost && path !== '/web') {
      const webUrl = new URL('/web', request.url);
      return NextResponse.redirect(webUrl);
  }

  // ==========================================
  // ★ AUTHENTICATION LOGIC
  // ==========================================
  const token = request.cookies.get('auth_token')?.value;
  let userRole = '';
  
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userRole = (payload.role as string) || 'customer';
    } catch (e) {
      const response = NextResponse.next();
      response.cookies.delete('auth_token');
      return response;
    }
  }

  const isPublicPath = publicPaths.some(p => path.startsWith(p));

  // ==========================================
  // ★ FORCE LOGIN LOGIC (মূল ডোমেইনের জন্য)
  // ==========================================
  if (!token && !isPublicPath && !isAdminDomain) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
  }

  if (token && (path === '/login' || path === '/register' || path === '/signup')) {
      if (isAdminDomain && userRole === 'admin') {
          return NextResponse.redirect(new URL('/', request.url));
      } else {
          return NextResponse.redirect(new URL('/', request.url));
      }
  }

  // ==========================================
  // CASE 1: অ্যাডমিন ডোমেইন সুরক্ষা (পরিবর্তিত অংশ)
  // ==========================================
  if (isAdminDomain) {
    // অ্যাডমিন ডোমেইনের নিজস্ব পাবলিক পাথ (লগইন পেজ সহ)
    const adminPublicPaths = ['/login', '/register', '/signup'];
    if (adminPublicPaths.includes(path)) {
      return NextResponse.next(); // অ্যাডমিন ডোমেইনে লগইন পেজ দেখাও, রিডাইরেক্ট করো না
    }

    // অননুমোদিত ইউজারকে অ্যাডমিন ডোমেইনের লগইন পেজে পাঠাও (মেইন সাইটের /web নয়)
    if (userRole !== 'admin') {
      const adminLoginUrl = new URL('/login', request.url);
      return NextResponse.redirect(adminLoginUrl);
    }

    // অ্যাডমিন ইউজারের জন্য URL রিরাইট/রিডাইরেক্ট
    if (path.startsWith('/admin')) {
        const newPath = path.replace(/^\/admin/, '') || '/';
        return NextResponse.redirect(new URL(newPath, request.url));
    }
    return NextResponse.rewrite(new URL(`/admin${path === '/' ? '' : path}`, request.url));
  }

  // ==========================================
  // CASE 2: মেইন ডোমেইন (admin নয়)
  // ==========================================
  if (!isAdminDomain) {
    if (path.startsWith('/admin')) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};