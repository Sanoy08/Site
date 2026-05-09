// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { responseWithCookie } from '@/lib/auth-utils';
import { rateLimit } from '@/lib/rate-limit'; // ★ Import

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';
const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: NextRequest) {
  try {
    // ★ 1. Rate Limiting (5 attempts per 60s)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!rateLimit(ip, 5, 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Try again later.' }, 
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Required fields missing' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const user = await db.collection(COLLECTION_NAME).findOne({ email: email.toLowerCase() });

    if (!user || !user.isVerified) {
      return NextResponse.json({ success: false, error: 'Invalid credentials or not verified' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate Token
    const token = jwt.sign(
      { _id: user._id.toString(), email: user.email, name: user.name, role: user.role || 'customer' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      wallet: user.wallet
    };

    return responseWithCookie(
        { success: true, message: 'Login successful!', user: userData }, 
        token
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}