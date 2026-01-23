// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // 'jose' লাইব্রেরি ব্যবহার করুন (npm install jose)

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // ১. কুকি থেকে টোকেন নেওয়া
  const token = request.cookies.get('auth_token')?.value;

  // ২. পাবলিক রাউট বাদ দেওয়া
  const isPublicPath = pathname === '/login' || pathname === '/register' || pathname === '/verify-otp';
  
  // ৩. ইউজার যদি লগইন অবস্থায় পাবলিক পেজে যায় -> রিডাইরেক্ট
  if (isPublicPath && token) {
    try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL('/', request.url));
    } catch (e) {
        // টোকেন ইনভ্যালিড হলে কিছু করার দরকার নেই, লগইন পেজেই থাকবে
    }
  }

  // ৪. প্রোটেক্টেড রাউট (Admin / Account / Delivery)
  if (pathname.startsWith('/admin') || pathname.startsWith('/account') || pathname.startsWith('/delivery')) {
    
    if (!token) {
        // টোকেন না থাকলে লগইনে পাঠাও
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        // টোকেন ভেরিফাই এবং রোল চেক
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const role = payload.role as string;

        // Admin Route Protection
        if (pathname.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Delivery Route Protection
        if (pathname.startsWith('/delivery') && role !== 'delivery' && role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }

    } catch (error) {
        // টোকেন এক্সপায়ার্ড বা ভুল হলে কুকি ডিলিট করে লগইনে পাঠাও
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth_token');
        return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/delivery/:path*',
    '/login',
    '/register',
    '/verify-otp'
  ],
};