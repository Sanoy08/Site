// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const path = request.nextUrl.pathname;

  // Cleaned up logic
  if (path.startsWith('/_next/') || 
      path.endsWith('.ico') || 
      path.startsWith('/api/')
      ) {
    return NextResponse.next();
  }

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