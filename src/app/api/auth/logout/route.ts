// src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  
  // ★★★ Fix: Cookie name must be 'auth_token'
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0 // Immediate expiry
  });

  return response;
}