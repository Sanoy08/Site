// src/lib/auth-utils.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // ★ jsonwebtoken এর বদলে jose ব্যবহার করা হলো

const JWT_SECRET_STR = process.env.JWT_SECRET!;
const COOKIE_NAME = 'auth_token';
const CRON_SECRET = process.env.CRON_SECRET!;

if (!JWT_SECRET_STR) {
  throw new Error('JWT_SECRET is not defined');
}

// jose লাইব্রেরি স্ট্রিংয়ের বদলে Uint8Array ব্যবহার করে সিক্রেট হিসেবে
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);

// 1. Cookie Options
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  domain: process.env.NODE_ENV === 'production' ? '.bumbaskitchen.app' : undefined, 
  maxAge: 30 * 24 * 60 * 60, // 30 Days
};

// 2. Verify Admin Helper
export async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role === 'admin';
  } catch (error) {
    return false;
  }
}

// 3. Get User Helper
// Supports both:
//   - Cookie-based auth (web browser / admin panel)
//   - Bearer Token auth (mobile app)
export async function getUser(request: NextRequest) {
  // 1. Try Bearer Token first (for React Native mobile app)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7);
    try {
      const { payload } = await jwtVerify(bearerToken, JWT_SECRET);
      return payload;
    } catch (error) {
      // Invalid bearer token — fall through to cookie check
    }
  }

  // 2. Fallback to Cookie (for web browser / Next.js pages / admin panel)
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookieToken) return null;

  try {
    const { payload } = await jwtVerify(cookieToken, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

// 4. Response with Cookie Helper
export function responseWithCookie(data: any, token: string, status = 200) {
  const response = NextResponse.json(data, { status });
  response.cookies.set(COOKIE_NAME, token, cookieOptions);
  return response;
}

// 5. Verify Cron Helper (Secured)
export function verifyCron(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  // ★ URL queryKey বাদ দেওয়া হয়েছে সিকিউরিটির জন্য। 
  // এখন শুধু Header দিয়ে ভেরিফাই হবে।
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    return true;
  }
  return false;
}