// src/app/api/auth/phone/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';

const DB_NAME = 'BumbasKitchenDB';
const USERS_COLLECTION = 'users';
const SMS_COLLECTION = 'smsQueue';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!rateLimit(ip, 3, 60 * 1000)) {
       return NextResponse.json({ success: false, error: 'Too many requests. Wait a minute.' }, { status: 429 });
    }

    const { phone, name, email } = await request.json();
    
    if (!phone || phone.length < 10) {
       return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // ১. চেক করা ইউজার আছে কিনা
    const existingUser = await db.collection(USERS_COLLECTION).findOne({ phone: phone });

    // ★ লজিক: যদি ইউজার না থাকে এবং নামও না দেওয়া হয় (তার মানে Login Page থেকে এসেছে)
    // তাহলে আমরা তাকে আটকাবো।
    if (!existingUser && !name) {
        return NextResponse.json({ 
            success: false, 
            error: 'Account not found. Please Sign Up first.' 
        }, { status: 404 });
    }

    // ২. OTP জেনারেট
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    // ৩. ডাটাবেস আপডেট (রেজিস্টার বা লগইন উভয়ের জন্য)
    const updateFields: any = {
        phone: phone, 
        otp: otpHash, 
        otpExpires: otpExpires,
        updatedAt: new Date()
    };

    // যদি রেজিস্টার পেজ থেকে নাম/ইমেল আসে, তবে তা আপডেট হবে
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;

    // নতুন ইউজারের ডিফল্ট ডাটা
    const setOnInsertFields: any = {
        createdAt: new Date(),
        isVerified: false, // OTP ভেরিফাই হলে true হবে
        role: 'customer',
        wallet: { currentBalance: 0, tier: "Bronze" }
    };

    // যদি ইমেল না দেয়, তবেই ডামি ইমেল বসবে (শুধুমাত্র নতুন একাউন্টের ক্ষেত্রে)
    if (!email) setOnInsertFields.email = `${phone}@no-email.com`;

    await db.collection(USERS_COLLECTION).updateOne(
        { phone: phone },
        { 
            $set: updateFields,
            $setOnInsert: setOnInsertFields
        },
        { upsert: true } // নতুন হলে তৈরি হবে (কারণ আমরা উপরে 'name' চেক করে নিয়েছি)
    );

    // ৪. SMS পাঠানো
    await db.collection(SMS_COLLECTION).insertOne({
        phone: phone,
        message: `Your Bumba's Kitchen OTP is: ${otp}. Valid for 10 mins.`,
        status: 'pending',
        createdAt: new Date()
    });

    return NextResponse.json({ success: true, message: 'OTP sent successfully.' });

  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}