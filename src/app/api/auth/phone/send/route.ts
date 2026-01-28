// src/app/api/auth/phone/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const DB_NAME = 'BumbasKitchenDB';

// Zod Schema
const sendOtpSchema = z.object({
  phone: z.string().min(10, "Invalid phone number").regex(/^\d+$/, "Phone must contain only numbers"),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
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

    // Logic Checks (Login vs Register)
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

    // 4. Update User in DB ( OTP Save)
    const updateFields: any = { phone, otp: otpHash, otpExpires, updatedAt: new Date() };
    if (name) updateFields.name = name;

    const setOnInsert: any = {
        createdAt: new Date(),
        isVerified: false,
        role: 'customer',
        wallet: { currentBalance: 0, tier: "Bronze" },
        email: `${phone}@no-email.com` // Dummy email
    };

    await usersCollection.updateOne(
        { phone },
        { $set: updateFields, $setOnInsert: setOnInsert },
        { upsert: true }
    );

    // ★★★ 5. WEBHOOK CALL (New Implementation) ★★★
    // সরাসরি আপনার ফোনকে কল করা হচ্ছে
    const webhookBaseUrl = process.env.MACRODROID_WEBHOOK_URL;
    
    if (webhookBaseUrl) {
        // মেসেজ তৈরি
        const message = `Your Bumba's Kitchen OTP is: ${otp}. Valid for 10 mins.`;
        
        // URL প্যারামিটার হিসেবে ডাটা পাঠানো
        // ফরম্যাট: URL/send_otp?phone=xxxxx&message=yyyy
        const webhookUrl = `${webhookBaseUrl}send_otp?phone=${phone}&message=${encodeURIComponent(message)}`;

        // আমরা await ব্যবহার করছি না যাতে ইউজারকে রেসপন্স দিতে দেরি না হয় (Fire and Forget)
        fetch(webhookUrl)
            .then(res => {
                if(res.ok) console.log("Webhook Triggered Successfully 🚀");
                else console.error("Webhook Failed", res.status);
            })
            .catch(err => console.error("Webhook Error", err));
            
    } else {
        console.error("MACRODROID_WEBHOOK_URL is missing in .env");
    }

    // SMS Queue তে আর সেভ করার দরকার নেই, কারণ আমরা লাইভ পাঠাচ্ছি।
    // তবে আপনি চাইলে ব্যাকআপ বা লগের জন্য রাখতে পারেন।

    return NextResponse.json({ success: true, message: 'OTP sent successfully.' });

  } catch (error: any) {
    console.error("OTP Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
