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
  
  // স্ট্যাটিক ফাইল (ছবি, ফন্ট, .apk) ইগনোর করো
  if (path.startsWith('/_next/') || path.includes('.')) {
    return NextResponse.next();
  }

  // ==========================================
  // ★ API BLOCKER: ব্রাউজার থেকে সরাসরি এক্সেস বন্ধ
  // ==========================================
  if (path.startsWith('/api/')) {
    const acceptHeader = request.headers.get('accept') || '';
    // যদি কেউ ব্রাউজারে টাইপ করে (GET request & text/html)
    if (request.method === 'GET' && acceptHeader.includes('text/html')) {
        return NextResponse.rewrite(new URL('/404', request.url));
    }
    // অ্যাপ/ফ্রন্টএন্ড থেকে কল হলে নরমালি যেতে দাও
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
      // টোকেন এক্সপায়ার হলে কুকি ক্লিয়ার করে দাও
      const response = NextResponse.next();
      response.cookies.delete('auth_token');
      return response;
    }
  }

  const isPublicPath = publicPaths.some(p => path.startsWith(p));

  // ==========================================
  // ★ FORCE LOGIN LOGIC
  // ==========================================
  if (!token && !isPublicPath) {
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
  // CASE 1: অ্যাডমিন ডোমেইন সুরক্ষা 
  // ==========================================
  if (isAdminDomain) {
    if (userRole !== 'admin') {
        // ডাইনামিক বেস ইউআরএল ব্যবহার করা হলো (লোকালহোস্টেও কাজ করবে)
        const mainDomainUrl = new URL('/', request.url);
        mainDomainUrl.hostname = mainDomainUrl.hostname.replace('admin.', '');
        return NextResponse.redirect(mainDomainUrl);
    }

    if (path.startsWith('/admin')) {
        const newPath = path.replace(/^\/admin/, '') || '/';
        return NextResponse.redirect(new URL(newPath, request.url));
    }
    return NextResponse.rewrite(new URL(`/admin${path === '/' ? '' : path}`, request.url));
  }

  // ==========================================
  // CASE 2: মেইন ডোমেইন 
  // ==========================================
  if (!isAdminDomain) {
    if (path.startsWith('/admin')) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // ★ matcher থেকে 'api' বাদ দেওয়া হয়েছে, যাতে API রুটেও মিডলওয়্যার রান করে
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};