// src/app/api/auth/phone/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const DB_NAME = 'BumbasKitchenDB';

// ১. সিকিউরলি এনভায়রনমেন্ট ভেরিয়েবল থেকে টপিক নেওয়া
const NTFY_TOPIC = process.env.NTFY_TOPIC;

const sendOtpSchema = z.object({
  phone: z.string().min(10, "Invalid phone number").regex(/^\d+$/, "Phone must contain only numbers"),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // সার্ভার কনফিগারেশন চেক (ক্রিটিক্যাল)
    if (!NTFY_TOPIC) {
        return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    // 1. Rate Limit
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!rateLimit(ip, 3, 60 * 1000)) {
       return NextResponse.json({ success: false, error: 'Too many requests. Please wait.' }, { status: 429 });
    }

    const body = await request.json();
    const validation = sendOtpSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.errors[0].message }, { status: 400 });
    }
    
    const { phone, name } = validation.data;
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.findOne({ phone });

    // Login/Register Logic
    if (!name && !existingUser) {
        return NextResponse.json({ success: false, error: 'Account not found. Please Register first.' }, { status: 404 });
    }
    if (name && existingUser) {
        return NextResponse.json({ success: false, error: 'Account already exists. Please Login.' }, { status: 409 });
    }

    // 3. OTP Generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    // 4. Update DB
    const updateFields: any = { phone, otp: otpHash, otpExpires, updatedAt: new Date() };
    if (name) updateFields.name = name;

    const setOnInsert: any = {
        createdAt: new Date(),
        isVerified: false,
        role: 'customer',
        wallet: { currentBalance: 0, tier: "Bronze" },
        email: `${phone}@no-email.com`
    };

    await usersCollection.updateOne(
        { phone },
        { $set: updateFields, $setOnInsert: setOnInsert },
        { upsert: true }
    );

    // ★★★ 5. NTFY PUSH (Clean & Silent) ★★★
    const message = `Your Bumba's Kitchen OTP is: ${otp}. Valid for 10 mins.`;

    try {
        await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
            method: 'POST',
            body: message,
            headers: {
                'Title': phone, // MacroDroid-এর জন্য টাইটেল
                'Priority': 'high',
                'Tags': 'sms'
            }
        });
    } catch (e) {
        // সাইলেন্টলি ফেইল করবে যাতে ইউজারের এক্সপেরিয়েন্স নষ্ট না হয়
        // ক্রিটিক্যাল ডিবাগিং ছাড়া এখানে লগ রাখার দরকার নেই
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully.' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}