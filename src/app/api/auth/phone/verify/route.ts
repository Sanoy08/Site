// src/app/api/auth/phone/verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { responseWithCookie } from '@/lib/auth-utils';

const DB_NAME = 'BumbasKitchenDB';
const USERS_COLLECTION = 'users';
const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // ১. ইউজার খোঁজা
    const user = await db.collection(USERS_COLLECTION).findOne({ phone: phone });

    if (!user || !user.otp) {
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    // ২. মেয়াদ এবং OTP চেক
    if (new Date() > new Date(user.otpExpires)) {
        return NextResponse.json({ success: false, error: 'OTP expired' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
        return NextResponse.json({ success: false, error: 'Wrong OTP' }, { status: 400 });
    }

    // ৩. ভেরিফাইড মার্ক করা এবং OTP মুছে ফেলা
    await db.collection(USERS_COLLECTION).updateOne(
        { _id: user._id },
        { 
            $set: { isVerified: true },
            $unset: { otp: "", otpExpires: "" }
        }
    );

    // ৪. টোকেন জেনারেট
    const token = jwt.sign(
        { _id: user._id.toString(), phone: user.phone, role: user.role || 'customer' },
        JWT_SECRET,
        { expiresIn: '30d' }
    );

    const userData = {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        role: user.role,
        isNewUser: user.name === 'New User' // ফ্রন্টএন্ড বুঝবে নাম সেট করতে হবে কিনা
    };

    return responseWithCookie(
        { success: true, message: 'Login successful!', user: userData },
        token
    );

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}