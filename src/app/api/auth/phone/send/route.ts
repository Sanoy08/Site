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
    const usersCollection = db.collection(USERS_COLLECTION);

    // ১. লগইন লজিক চেক (Login Page থেকে আসলে নাম থাকে না)
    const existingUser = await usersCollection.findOne({ phone: phone });
    if (!existingUser && !name) {
        return NextResponse.json({ 
            success: false, 
            error: 'Account not found. Please Sign Up first.' 
        }, { status: 404 });
    }

    // ২. ★★★ ইমেল ডুপ্লিকেট চেক (New Fix) ★★★
    if (email) {
        // এমন ইউজার খোঁজো যার এই ইমেল আছে, কিন্তু ফোন নম্বর আলাদা
        const duplicateEmailUser = await usersCollection.findOne({ 
            email: email, 
            phone: { $ne: phone } // $ne মানে Not Equal (বর্তমান নম্বর বাদে)
        });

        if (duplicateEmailUser) {
            return NextResponse.json({ 
                success: false, 
                error: 'This email is already linked to another account.' 
            }, { status: 409 });
        }
    }

    // ৩. OTP জেনারেট
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    // ৪. ডাটাবেস আপডেট লজিক
    const updateFields: any = {
        phone: phone, 
        otp: otpHash, 
        otpExpires: otpExpires,
        updatedAt: new Date()
    };

    if (name) updateFields.name = name;
    if (email) updateFields.email = email;

    const setOnInsertFields: any = {
        createdAt: new Date(),
        isVerified: false,
        role: 'customer',
        wallet: { currentBalance: 0, tier: "Bronze" }
    };

    if (!email) setOnInsertFields.email = `${phone}@no-email.com`;

    // ডাটাবেস আপডেট
    await usersCollection.updateOne(
        { phone: phone },
        { 
            $set: updateFields,
            $setOnInsert: setOnInsertFields
        },
        { upsert: true }
    );

    // ৫. SMS পাঠানো
    await db.collection(SMS_COLLECTION).insertOne({
        phone: phone,
        message: `Your Bumba's Kitchen OTP is: ${otp}. Valid for 10 mins.`,
        status: 'pending',
        createdAt: new Date()
    });

    return NextResponse.json({ success: true, message: 'OTP sent successfully.' });

  } catch (error: any) {
    console.error("Send OTP Error:", error);
    
    // মঙ্গোডিবির ডুপ্লিকেট এরর হ্যান্ডলিং (Safety Check)
    if (error.code === 11000) {
        return NextResponse.json({ 
            success: false, 
            error: 'Email or Phone already exists.' 
        }, { status: 409 });
    }

    return NextResponse.json({ success: false, error: 'Server error occurred.' }, { status: 500 });
  }
}