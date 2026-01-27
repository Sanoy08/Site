// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host');
  const path = url.pathname;

  // ১. স্ট্যাটিক ফাইল এবং API রিকোয়েস্টগুলো স্কিপ করুন (এগুলোতে কোনো বাধার দরকার নেই)
  if (
    path.startsWith('/_next/') || 
    path.includes('.') || // images, favicon, etc.
    path.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  if (!hostname) return NextResponse.next();

  // চেক করুন এটি অ্যাডমিন সাবডোমেইন কিনা
  const isSubdomain = hostname.startsWith('admin.');

  // ============================================================
  // CASE 1: ইউজার যদি মেইন ডোমেইনে (www.bumbaskitchen.app) থাকে
  // ============================================================
  if (!isSubdomain) {
    // যদি কেউ মেইন ডোমেইন দিয়ে /admin এ ঢোকার চেষ্টা করে -> তাকে 404 দেখাও
    // এতে তারা বুঝতেই পারবে না যে অ্যাডমিন পেজ আছে।
    if (path.startsWith('/admin')) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
    // অন্য সব সাধারণ পেজের জন্য স্বাভাবিক আচরণ
    return NextResponse.next();
  }

  // ============================================================
  // CASE 2: ইউজার যদি সাবডোমেইনে (admin.bumbaskitchen.app) থাকে
  // ============================================================
  if (isSubdomain) {
    
    // ২.১: যদি ইউজার ভুল করে URL এ '/admin' লিখে ফেলে (যেমন: admin.site.com/admin/products)
    // তাহলে তাকে ক্লিন URL এ রিডাইরেক্ট করুন (admin.site.com/products)
    if (path.startsWith('/admin')) {
        // '/admin' অংশটি কেটে বাদ দেওয়া হচ্ছে
        const newPath = path.replace(/^\/admin/, '') || '/';
        return NextResponse.redirect(new URL(newPath, request.url));
    }

    // ২.২: আসল কাজ (Rewrite)
    // ইউজার দেখবে: admin.bumbaskitchen.app/products
    // নেক্সটজেএস লোড করবে: /src/app/admin/products
    return NextResponse.rewrite(new URL(`/admin${path === '/' ? '' : path}`, request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};