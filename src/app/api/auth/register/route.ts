// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendNotificationToUser } from '@/lib/notification';
import { responseWithCookie } from '@/lib/auth-utils';
import { z } from 'zod';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';
const JWT_SECRET = process.env.JWT_SECRET!;

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(6),
  phone: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.errors[0].message }, { status: 400 });
    }
    const { email, otp, password, name, phone } = validation.data;

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);
    const userRecord = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!userRecord || userRecord.isVerified) {
      return NextResponse.json({ success: false, error: 'Invalid request or user verified' }, { status: 400 });
    }

    // OTP Verify
    if (!userRecord.otp || new Date() > new Date(userRecord.otpExpires)) {
         return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }
    const isOtpValid = await bcrypt.compare(otp, userRecord.otp);
    if (!isOtpValid) return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });

    // Update User
    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.updateOne(
      { _id: userRecord._id },
      {
        $set: {
          name: name.trim(),
          phone: phone || "",
          password: hashedPassword,
          isVerified: true,
          role: 'customer',
          wallet: { currentBalance: 0, tier: "Bronze" }
        },
        $unset: { otp: "", otpExpires: "" }
      }
    );

    // Token
    const token = jwt.sign(
        { _id: userRecord._id.toString(), email: userRecord.email, name, role: 'customer' }, 
        JWT_SECRET, 
        { expiresIn: '30d' }
    );

    // Notification (Optional fail-safe)
    try {
        await sendNotificationToUser(client, userRecord._id.toString(), "Welcome!", "Thanks for joining us!", '/menus');
    } catch (e) {}

    // ✅ Return Response with Cookie
    return responseWithCookie(
        { success: true, message: 'Verified!', user: { id: userRecord._id.toString(), name, email: userRecord.email, role: 'customer' } },
        token,
        201
    );

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}