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
    const body = await request.json();
    const { phone, otp } = body;

    // Fix: NoSQL Injection Prevention & Strict Type Validation
    if (!phone || typeof phone !== 'string' || !/^\d{10}$/.test(phone)) {
        return NextResponse.json({ success: false, error: 'Invalid phone number format.' }, { status: 400 });
    }
    if (!otp || typeof otp !== 'string') {
        return NextResponse.json({ success: false, error: 'Invalid OTP format.' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // ১. ইউজার খোঁজা
    const user = await db.collection(USERS_COLLECTION).findOne({ phone: phone });

    if (!user || !user.otp) {
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    // ২. মেয়াদ এবং OTP চেক
    if (new Date() > new Date(user.otpExpires)) {
        return NextResponse.json({ success: false, error: 'OTP expired' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
        const attempts = (user.otpAttempts || 0) + 1;
        
        if (attempts >= 5) {
            await db.collection(USERS_COLLECTION).updateOne(
                { _id: user._id },
                { $unset: { otp: "", otpExpires: "", otpAttempts: "" } }
            );
            return NextResponse.json({ success: false, error: 'Too many failed attempts. Please request a new OTP.' }, { status: 429 });
        } else {
            await db.collection(USERS_COLLECTION).updateOne(
                { _id: user._id },
                { $set: { otpAttempts: attempts } }
            );
            return NextResponse.json({ success: false, error: `Wrong OTP. ${5 - attempts} attempts remaining.` }, { status: 400 });
        }
    }

    // ৩. ভেরিফাইড মার্ক করা এবং OTP মুছে ফেলা
    await db.collection(USERS_COLLECTION).updateOne(
        { _id: user._id },
        { 
            $set: { isVerified: true },
            $unset: { otp: "", otpExpires: "", otpAttempts: "" }
        }
    );

    // ৪. টোকেন জেনারেট
    const token = jwt.sign(
        { _id: user._id.toString(), phone: user.phone, role: user.role || 'customer' },
        JWT_SECRET,
        { expiresIn: '30d' }
    );

    // ★★★ FIX: এখানে সমস্ত প্রয়োজনীয় ডেটা পাঠানো হলো
    const userData = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        picture: user.picture,
        address: user.address,
        wallet: user.wallet,
        dob: user.dob,                                  // ★ Added
        anniversary: user.anniversary,                  // ★ Added
        savedAddresses: user.savedAddresses || [],      // ★ Added
        isNewUser: user.name === 'New User' 
    };

    return responseWithCookie(
        { success: true, message: 'Login successful!', user: userData, token },
        token
    );

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}