// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // Edge Runtime এ jose ব্যবহার করতে হয়

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const path = url.pathname;
  
  // স্ট্যাটিক ফাইল ইগনোর করুন
  if (path.startsWith('/_next/') || path.includes('.') || path.startsWith('/api/')) {
    return NextResponse.next();
  }

  // সাবডোমেইন ডিটেকশন
  // লোকালহোস্টে টেস্ট করার জন্য 'admin' সাবডোমেইন সিমুলেট করা কঠিন, তাই প্রোডাকশন লজিক
  const isAdminDomain = hostname.startsWith('admin.');

  // টোকেন যাচাই
  const token = request.cookies.get('auth_token')?.value;
  let userRole = '';
  
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userRole = (payload.role as string) || 'customer';
    } catch (e) {
      // ইনভ্যালিড টোকেন
    }
  }

  // ==========================================
  // CASE 1: অ্যাডমিন ডোমেইন সুরক্ষা (admin.bumbaskitchen.app)
  // ==========================================
  if (isAdminDomain) {
    // ১. যদি লগইন না থাকে -> মেইন সাইটের লগইন পেজে পাঠাও
    if (!token) {
        const loginUrl = new URL('/login', 'https://bumbaskitchen.app'); 
        // (লোকালহোস্টে কাজ করার জন্য hardcoded URL এর বদলে request.url রিপ্লেস করা ভালো)
        return NextResponse.redirect(loginUrl);
    }

    // ২. লগইন আছে কিন্তু অ্যাডমিন না -> বের করে দাও
    if (userRole !== 'admin') {
        // মেইন ডোমেইনের হোমপেজে ফেরত
        return NextResponse.redirect(new URL('/', 'https://bumbaskitchen.app'));
    }

    // ৩. সবকিছু ঠিক থাকলে -> URL Rewrite (ফোল্ডার ম্যাপ করা)
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

    // লগইন পেজে যদি অ্যাডমিন আসে, তাকে ড্যাশবোর্ডে পাঠাও
    if (path === '/login' && token && userRole === 'admin') {
       return NextResponse.redirect(new URL('/', 'https://admin.bumbaskitchen.app'));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};