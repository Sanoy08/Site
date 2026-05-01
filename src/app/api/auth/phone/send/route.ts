// src/app/api/auth/phone/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const DB_NAME = 'BumbasKitchenDB';
const NTFY_TOPIC = process.env.NTFY_TOPIC;

const sendOtpSchema = z.object({
  phone: z.string().min(10, "Invalid phone number").regex(/^\d+$/, "Phone must contain only numbers"),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    if (!NTFY_TOPIC) {
        return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    // ইউজারের IP অ্যাড্রেস বের করা
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    const body = await request.json();
    const validation = sendOtpSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.errors[0].message }, { status: 400 });
    }
    
    const { phone, name } = validation.data;
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // ★★★ BOT & SPAM PROTECTION (24 HOURS LIMIT) ★★★
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const otpLogsCollection = db.collection('otp_logs');

    // ১. IP Limit Check (Max 5 per day)
    const ipAttempts = await otpLogsCollection.countDocuments({ 
        ip, 
        createdAt: { $gte: twentyFourHoursAgo } 
    });
    
    if (ipAttempts >= 5) {
        return NextResponse.json({ 
            success: false, 
            error: 'Too many requests from this device. Please try again after 24 hours.' 
        }, { status: 429 });
    }

    // ২. Phone Limit Check (Max 3 per day)
    const phoneAttempts = await otpLogsCollection.countDocuments({ 
        phone, 
        createdAt: { $gte: twentyFourHoursAgo } 
    });

    if (phoneAttempts >= 3) {
        return NextResponse.json({ 
            success: false, 
            error: `Maximum 3 OTPs allowed per number in 24 hours. Limit reached for +91 ${phone}.` 
        }, { status: 429 });
    }
    // ★★★ END PROTECTION ★★★

    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.findOne({ phone });

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

    // ★ 5. Log the successful OTP attempt
    await otpLogsCollection.insertOne({
        ip,
        phone,
        createdAt: new Date()
    });

    // 6. NTFY PUSH
    const message = `Your Bumba's Kitchen OTP is: ${otp}. Valid for 10 mins.`;
    try {
        await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
            method: 'POST',
            body: message,
            headers: {
                'Title': phone,
                'Priority': 'high',
                'Tags': 'sms'
            }
        });
    } catch (e) {
        // silent fail
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully.' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}