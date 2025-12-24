import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const path = request.nextUrl.pathname;

  // 1. Skip Next.js internals and API
  if (path.startsWith('/_next/') || 
      path.endsWith('.ico') || 
      path.startsWith('/api/') || 
      path.startsWith('/images/') ||
      path.startsWith('/icons/')
      ) {
    return NextResponse.next();
  }

  // Cookie theke token check kora
  const token = request.cookies.get('token')?.value;

  // 2. ★★★ DELIVERY APP PROTECTION ★★★
  // Jodi path /delivery hoy ebong /delivery/login na hoy
  if (path.startsWith('/delivery') && path !== '/delivery/login') {
      if (!token) {
          // Token na thakle login page a pathao
          return NextResponse.redirect(new URL('/delivery/login', request.url));
      }
  }

  // 3. Already Logged In Logic
  // Jodi delivery boy login kora thake, take login page theke sorie dashboard a pathao
  if (path === '/delivery/login' && token) {
      return NextResponse.redirect(new URL('/delivery', request.url));
  }

  // 4. Subdomain Logic (Admin)
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