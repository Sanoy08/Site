// src/app/api/auth/phone/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const DB_NAME = 'BumbasKitchenDB';

// Zod Schema (Email removed)
const sendOtpSchema = z.object({
  phone: z.string().min(10, "Invalid phone number").regex(/^\d+$/, "Phone must contain only numbers"),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  let session;
  try {
    // 1. Rate Limit
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!rateLimit(ip, 3, 60 * 1000)) {
       return NextResponse.json({ success: false, error: 'Too many requests. Please wait.' }, { status: 429 });
    }

    const body = await request.json();
    
    // 2. Validation
    const validation = sendOtpSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.errors[0].message }, { status: 400 });
    }
    
    const { phone, name } = validation.data;
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    const existingUser = await usersCollection.findOne({ phone });

    // ★★★ STRICT LOGIC START (আপনার লজিক ঠিক আছে) ★★★

    // Login Attempt (Name নেই, ইউজারও নেই) -> Error
    if (!name && !existingUser) {
        return NextResponse.json({ 
            success: false, 
            error: 'Account not found. Please Register first.' 
        }, { status: 404 });
    }

    // Register Attempt (Name আছে, কিন্তু ইউজার অলরেডি আছে) -> Error
    if (name && existingUser) {
        return NextResponse.json({ 
            success: false, 
            error: 'Account already exists. Please Login.' 
        }, { status: 409 });
    }
    // ★★★ STRICT LOGIC END ★★★

    // 3. OTP Generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    // 4. Transaction Start
    session = client.startSession();
    session.startTransaction();

    try {
        const updateFields: any = { phone, otp: otpHash, otpExpires, updatedAt: new Date() };
        
        // Only update name if provided (Registration)
        if (name) updateFields.name = name;

        // ★★★ FIX: Dummy Email Restore করা হলো ★★★
        // এটা না থাকলে ২য় ইউজার সাইনআপ করার সময় ডাটাবেস Crash করবে (Duplicate Key Error)
        const setOnInsert: any = {
            createdAt: new Date(),
            isVerified: false,
            role: 'customer',
            wallet: { currentBalance: 0, tier: "Bronze" },
            // আমরা ইউজারের ফোন নম্বর দিয়েই একটা ফেক ইমেল বানিয়ে দিচ্ছি
            email: `${phone}@no-email.com` 
        };

        await usersCollection.updateOne(
            { phone },
            { $set: updateFields, $setOnInsert: setOnInsert },
            { upsert: true, session }
        );

        // SMS Queue
        await db.collection('smsQueue').insertOne({
            phone,
            message: `Your Bumba's Kitchen OTP is: ${otp}. Valid for 10 mins.`,
            status: 'pending',
            createdAt: new Date()
        }, { session });

        await session.commitTransaction();

    } catch (err) {
        await session.abortTransaction();
        throw err;
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully.' });

  } catch (error: any) {
    console.error("OTP Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  } finally {
    if (session) await session.endSession();
  }
}