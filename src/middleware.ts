// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretStr = process.env.JWT_SECRET;
if (!secretStr) throw new Error('JWT_SECRET is missing!');
const JWT_SECRET = new TextEncoder().encode(secretStr);

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const path = url.pathname;
  
  // ★ ধাপ ১: এপিআই রিকোয়েস্টকে শুরুতেই মুক্তি দিন (সবচেয়ে গুরুত্বপূর্ণ)
  // এটি থাকলে সাবডোমেইন বা মেইন ডোমেইন—কোথাও এপিআই আটকাবে না
  if (path.startsWith('/api/') || path.startsWith('/_next/') || path.includes('.')) {
    return NextResponse.next();
  }

  const isAdminDomain = hostname.startsWith('admin.');
  const token = request.cookies.get('auth_token')?.value;
  let userRole = '';
  
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userRole = (payload.role as string) || 'customer';
    } catch (e) { }
  }

  // ==========================================
  // CASE 1: অ্যাডমিন ডোমেইন (admin.bumbaskitchen.app)
  // ==========================================
  if (isAdminDomain) {
    if (!token) {
        return NextResponse.redirect(new URL('/login', 'https://www.bumbaskitchen.app'));
    }
    if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/', 'https://www.bumbaskitchen.app'));
    }

    // অ্যাডমিন ডোমেইনে /admin পাথ থাকলে সেটা ক্লিন করে রিরাইট করা
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
    const allowedAdminRoutes = ['/admin/orders', '/admin/custom-invoice'];
    const isAllowedAdminRoute = allowedAdminRoutes.some(r => path.startsWith(r));

    if (path.startsWith('/admin')) {
      if (isAllowedAdminRoute) {
        if (!token || userRole !== 'admin') {
          return NextResponse.redirect(new URL('/login', request.url));
        }
      } else {
        return NextResponse.rewrite(new URL('/404', request.url));
      }
    }

    if (path === '/login' && token && userRole === 'admin') {
       return NextResponse.redirect(new URL('/admin/orders', request.url));
    }
  }

  return NextResponse.next();
}

// ★ ধাপ ২: ম্যাচার আপডেট (api ইগনোর করার লজিকটি এখান থেকে সরিয়ে দিলাম যাতে মিডলওয়্যার নিজেই সেটা হ্যান্ডেল করে)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
