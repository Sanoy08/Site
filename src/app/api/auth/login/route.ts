// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod'; // npm install zod (যদি না থাকে)
import { rateLimit } from '@/lib/rate-limit'; // উপরের তৈরি করা ফাইলটি

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';
const JWT_SECRET = process.env.JWT_SECRET!;

// এনভায়রনমেন্ট ভেরিয়েবল চেক
if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

// Zod স্কিমা (ইনপুট ভ্যালিডেশনের জন্য)
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    // ১. IP Address বের করা এবং Rate Limit চেক করা
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // ১ মিনিটে ৫ বারের বেশি চেষ্টা করলে ব্লক করা হবে
    if (!rateLimit(ip, 5, 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again after 1 minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // ২. Zod দিয়ে ইনপুট ভ্যালিডেশন
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // ৩. ডেটাবেস কানেকশন
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    // ৪. ইউজার খোঁজা (Case-insensitive)
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    // ৫. ইউজার চেক এবং ভেরিফিকেশন স্ট্যাটাস দেখা
    if (!user) {
      // সিকিউরিটির জন্য আমরা নির্দিষ্ট করে বলব না যে "ইমেইল ভুল", যাতে হ্যাকার ইমেইল গেস করতে না পারে
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { success: false, error: 'Account not verified. Please verify your OTP first.' },
        { status: 403 } // 403 Forbidden
      );
    }

    // ৬. পাসওয়ার্ড ম্যাচ করা
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // ৭. JWT টোকেন জেনারেট করা
    const token = jwt.sign(
      { 
        _id: user._id.toString(), 
        email: user.email, 
        name: user.name, 
        role: user.role || 'customer' // রোল না থাকলে কাস্টমার ধরা হবে
      },
      JWT_SECRET!,
      { expiresIn: '30d' }
    );

    // ৮. সফল রেসপন্স পাঠানো
    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address || null, // এড্রেস না থাকলে নাল
        wallet: user.wallet || { currentBalance: 0 }
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error. Please try again later.' },
      { status: 500 }
    );
  }
}