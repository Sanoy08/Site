// src/lib/auth-utils.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'auth_token'; // ★★★ নাম ফিক্স করা হয়েছে
const CRON_SECRET = process.env.CRON_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

// 1. Cookie Options (Production Ready)
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 30 * 24 * 60 * 60, // 30 Days
};

// 2. Helper to verify admin from Request Cookie
export async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value; // ★★★ ফিক্সড

  if (!token) return false;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.role === 'admin';
  } catch (error) {
    return false;
  }
}

// 3. Helper to verify any user and return payload
// ★★★ নাম পরিবর্তন: verifyUser -> getUser
export async function getUser(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value; // ★★★ ফিক্সড
  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

// 4. Helper to create response with cookie
export function responseWithCookie(data: any, token: string, status = 200) {
  const response = NextResponse.json(data, { status });
  response.cookies.set(COOKIE_NAME, token, cookieOptions); // ★★★ ফিক্সড
  return response;
}


// ★ ৫. নতুন হেল্পার: Cron Job ভেরিফাই করার জন্য
export function verifyCron(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const queryKey = searchParams.get('key');

  // সিক্রেট চেক: হেডার (Bearer Token) অথবা URL Query Parameter (?key=...)
  if (authHeader === `Bearer ${CRON_SECRET}` || queryKey === CRON_SECRET) {
    return true;
  }
  return false;
}