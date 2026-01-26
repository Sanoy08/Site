// src/app/api/auth/phone/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const DB_NAME = 'BumbasKitchenDB';

// Zod Schema for Validation
const sendOtpSchema = z.object({
  phone: z.string().min(10, "Invalid phone number").regex(/^\d+$/, "Phone must contain only numbers"),
  name: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  let session;
  try {
    // ১. রেট লিমিট (IP Based)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!rateLimit(ip, 3, 60 * 1000)) { // 1 min এ 3 বার
       return NextResponse.json({ success: false, error: 'Too many requests. Please wait.' }, { status: 429 });
    }

    const body = await request.json();
    
    // ২. ইনপুট ভ্যালিডেশন (Zod)
    const validation = sendOtpSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.errors[0].message }, { status: 400 });
    }
    
    const { phone, name, email } = validation.data;
    
    // ৩. ফোন নম্বর ভিত্তিক রেট লিমিট (Custom Check)
    // (এখানে আপনি চাইলে Redis বা DB তে চেক করতে পারেন যে এই নম্বরে last 10 min এ কয়টা OTP গেছে)

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // ৪. লগইন লজিক চেক
    const existingUser = await usersCollection.findOne({ phone });
    if (!existingUser && !name) {
        return NextResponse.json({ success: false, error: 'Account not found. Please Sign Up first.' }, { status: 404 });
    }

    // ৫. ইমেল ডুপ্লিকেট চেক
    if (email) {
        const duplicateUser = await usersCollection.findOne({ email, phone: { $ne: phone } });
        if (duplicateUser) {
            return NextResponse.json({ success: false, error: 'This email is already linked to another account.' }, { status: 409 });
        }
    }

    // ৬. OTP জেনারেট
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    // ★★★ ৭. Transaction শুরু (Atomic Operation) ★★★
    session = client.startSession();
    session.startTransaction();

    try {
        // Step A: User Update/Upsert
        const updateFields: any = { phone, otp: otpHash, otpExpires, updatedAt: new Date() };
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;

        const setOnInsert: any = {
            createdAt: new Date(),
            isVerified: false,
            role: 'customer',
            wallet: { currentBalance: 0, tier: "Bronze" },
            email: email || `${phone}@no-email.com`
        };

        await usersCollection.updateOne(
            { phone },
            { $set: updateFields, $setOnInsert: setOnInsert },
            { upsert: true, session }
        );

        // Step B: SMS Queue Insert
        await db.collection('smsQueue').insertOne({
            phone,
            message: `Your Bumba's Kitchen OTP is: ${otp}. Valid for 10 mins.`,
            status: 'pending',
            createdAt: new Date()
        }, { session });

        // সব ঠিক থাকলে Commit করো
        await session.commitTransaction();

    } catch (err) {
        // কোনো একটা ফেইল হলে সব বাতিল (Rollback)
        await session.abortTransaction();
        throw err; // মেইন ক্যাচ ব্লকে পাঠাও
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully.' });

  } catch (error: any) {
    console.error("OTP Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  } finally {
    if (session) await session.endSession();
  }
}