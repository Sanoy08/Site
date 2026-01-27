import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const path = url.pathname;
  const token = request.cookies.get('auth_token')?.value;

  // ১. স্ট্যাটিক ফাইল এবং পাবলিক API স্কিপ করুন
  if (
    path.startsWith('/_next/') || 
    path.includes('.') || 
    path.startsWith('/api/auth') // লগইন/OTP API খোলা রাখতে হবে
  ) {
    return NextResponse.next();
  }

  // ২. টোকেন ভেরিফিকেশন এবং রোল ডিটেকশন
  let userRole = null;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      userRole = payload.role as string;
    } catch (err) {
      // টোকেন ইনভ্যালিড হলে কিছু করার দরকার নেই, ইউজার লগআউট অবস্থায় আছে
    }
  }

  const isSubdomain = hostname.startsWith('admin.');

  // ============================================================
  // CASE 1: অ্যাডমিন সাবডোমেইন হ্যান্ডলিং (admin.bumbaskitchen.app)
  // ============================================================
  if (isSubdomain) {
    // যদি লগইন না থাকে -> মেইন ডোমেইনের লগইনে পাঠান
    if (!userRole) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.hostname = hostname.replace('admin.', 'www.'); // মেইন ডোমেইনে ফেরত
      return NextResponse.redirect(loginUrl);
    }

    // যদি ইউজার অ্যাডমিন না হয় -> মেইন সাইটে ফেরত পাঠান
    if (userRole !== 'admin') {
      const homeUrl = new URL('/', request.url);
      homeUrl.hostname = hostname.replace('admin.', 'www.');
      return NextResponse.redirect(homeUrl);
    }

    // URL Rewrite (আগের লজিক ঠিক আছে)
    if (path.startsWith('/admin')) {
        const newPath = path.replace(/^\/admin/, '') || '/';
        return NextResponse.redirect(new URL(newPath, request.url));
    }
    return NextResponse.rewrite(new URL(`/admin${path === '/' ? '' : path}`, request.url));
  }

  // ============================================================
  // CASE 2: মেইন ডোমেইন (www.bumbaskitchen.app)
  // ============================================================
  if (!isSubdomain) {
    // অ্যাডমিন পেজ এক্সেস বন্ধ
    if (path.startsWith('/admin')) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
    
    // সুরক্ষিত পেজ (Account, Orders, Checkout) - লগইন ছাড়া ঢুকতে পারবে না
    const protectedPaths = ['/account', '/checkout', '/orders'];
    if (protectedPaths.some(p => path.startsWith(p)) && !token) {
       return NextResponse.redirect(new URL('/login', request.url));
    }
    
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};