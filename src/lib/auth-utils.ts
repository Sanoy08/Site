// src/lib/auth-utils.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'auth_token';
const CRON_SECRET = process.env.CRON_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

// 1. Cookie Options (UPDATED for Subdomains)
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  // কুকি সাবডোমেইনে কাজ করার জন্য
  domain: process.env.NODE_ENV === 'production' ? '.bumbaskitchen.app' : undefined, 
  maxAge: 30 * 24 * 60 * 60, // 30 Days
};

// 2. ★★★ Verify Admin Helper (এটি মিসিং ছিল) ★★★
export async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) return false;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.role === 'admin';
  } catch (error) {
    return false;
  }
}

// 3. Get User Helper
export async function getUser(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded;
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

// 5. Verify Cron Helper
export function verifyCron(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const queryKey = searchParams.get('key');

  if (authHeader === `Bearer ${CRON_SECRET}` || queryKey === CRON_SECRET) {
    return true;
  }
  return false;
}