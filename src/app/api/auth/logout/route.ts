// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  
  // কুকি রিমুভ করার কনফিগারেশন (Login এর সাথে হুবহু মিলতে হবে)
  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    // ★★★ CRITICAL FIX: ডোমেইন ম্যাচ না করলে কুকি ডিলিট হয় না ★★★
    domain: isProduction ? '.bumbaskitchen.app' : undefined, 
    maxAge: 0, // সাথে সাথে এক্সপায়ার হবে
    expires: new Date(0) // ডাবল সেফটি (পুরানো ব্রাউজারের জন্য)
  });

  return response;
}