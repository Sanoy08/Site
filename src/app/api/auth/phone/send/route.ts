// src/app/api/auth/phone/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit'; // Rate Limit ব্যবহার করলাম

const DB_NAME = 'BumbasKitchenDB';
const USERS_COLLECTION = 'users';
const SMS_COLLECTION = 'smsQueue';

export async function POST(request: NextRequest) {
  try {
    // ১. রেট লিমিট (স্প্যাম ঠেকানো)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!rateLimit(ip, 3, 60 * 1000)) {
       return NextResponse.json({ success: false, error: 'Too many requests. Wait a minute.' }, { status: 429 });
    }

    const { phone } = await request.json();
    
    // ফোন নম্বর ফরম্যাট চেক (বেসিক)
    if (!phone || phone.length < 10) {
       return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // ২. OTP জেনারেট
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // ১০ মিনিট মেয়াদ

    // ৩. ইউজারের ডাটাবেসে OTP আপডেট/তৈরি করা
    // যদি ইউজার আগে না থাকে, আমরা তাকে 'Guest' হিসেবে সেভ করব, পরে নাম আপডেট করবে
    await db.collection(USERS_COLLECTION).updateOne(
        { phone: phone },
        { 
            $set: { 
                phone: phone, 
                otp: otpHash, 
                otpExpires: otpExpires,
                // যদি নতুন হয়, তবে এই ফিল্ডগুলো সেট হবে
                updatedAt: new Date()
            },
            $setOnInsert: { 
                createdAt: new Date(),
                isVerified: false,
                role: 'customer',
                email: `${phone}@no-email.com`, // ডামি ইমেল, যাতে এরর না দেয়
                name: 'New User'
            }
        },
        { upsert: true }
    );

    // ৪. SMS Queue-তে পাঠানো (তোমার ফোন এটা পিক করবে)
    await db.collection(SMS_COLLECTION).insertOne({
        phone: phone,
        message: `Your Bumba's Kitchen OTP is: ${otp}. Valid for 10 mins.`,
        status: 'pending',
        createdAt: new Date()
    });

    return NextResponse.json({ success: true, message: 'OTP sending initiated.' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}