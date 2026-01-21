// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendNotificationToUser } from '@/lib/notification';
import { z } from 'zod'; // Zod ইমপোর্ট (অবশ্যই `npm install zod` দিয়ে ইনস্টল করে নিন)

// ১. কনফিগারেশন এবং সিকিউরিটি চেক
const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';
const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

// ২. ইনপুট ভ্যালিডেশন স্কিমা (Zod)
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(), // ফোন নম্বর অপশনাল হতে পারে, তবে থাকলে ভ্যালিড হতে হবে
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ৩. Zod দিয়ে ইনপুট ভ্যালিডেশন
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      // ভ্যালিডেশন ফেইল করলে প্রথম এররটি রিটার্ন করা হবে
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // ভ্যালিডেটেড ডেটা ব্যবহার করা (টাইপ-সেফ)
    const { email, otp, password, name, phone } = validation.data;

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    // ৪. ইউজার রেকর্ড খোঁজা
    const userRecord = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!userRecord) {
      return NextResponse.json(
        { success: false, error: 'User not found. Please request OTP first.' },
        { status: 404 }
      );
    }

    if (userRecord.isVerified) {
      return NextResponse.json(
        { success: false, error: 'User already verified. Please login.' },
        { status: 400 }
      );
    }

    // ৫. OTP ভেরিফাই করা (টাইমিং এবং হ্যাশ চেক)
    if (!userRecord.otp || !userRecord.otpExpires) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP request.' },
        { status: 400 }
      );
    }

    // OTP মেয়াদ চেক
    if (new Date() > new Date(userRecord.otpExpires)) {
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // OTP ম্যাচ চেক (Bcrypt)
    const isOtpValid = await bcrypt.compare(otp, userRecord.otp);
    if (!isOtpValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP provided.' },
        { status: 400 }
      );
    }

    // ৬. পাসওয়ার্ড হ্যাশ করা এবং প্রোফাইল আপডেট করা
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await usersCollection.updateOne(
      { _id: userRecord._id },
      {
        $set: {
          name: name.trim(),
          phone: phone ? phone.trim() : "",
          password: hashedPassword,
          isVerified: true,
          role: 'customer', // ডিফল্ট রোল
          wallet: { currentBalance: 0, tier: "Bronze" }, // ওয়ালেট শুরু
          updatedAt: new Date()
        },
        $unset: { otp: "", otpExpires: "" } // OTP মুছে ফেলা (সিকিউরিটি)
      }
    );

    // ৭. ওয়েলকাম পুশ নোটিফিকেশন পাঠানো
    try {
        await sendNotificationToUser(
            client,
            userRecord._id.toString(),
            "Welcome to Bumba's Kitchen! 🎊",
            "Thanks for joining us. Order your first meal now and get exciting offers!",
            '/menus'
        );
    } catch (notifError) {
        console.error("Failed to send welcome notification:", notifError);
        // নোটিফিকেশন ফেইল করলেও রেজিস্ট্রেশন প্রসেস আটকাবে না
    }

    // ৮. লগইন টোকেন জেনারেট করা
    if (!JWT_SECRET) {
         throw new Error('JWT_SECRET missing during token generation');
    }

    const token = jwt.sign(
        { 
            _id: userRecord._id.toString(), 
            email: userRecord.email, 
            name, 
            role: 'customer' 
        }, 
        JWT_SECRET, 
        { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      message: 'Account verified and created successfully!',
      token,
      user: { 
          id: userRecord._id.toString(), 
          name, 
          email: userRecord.email, 
          role: 'customer', 
          phone: phone 
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' }, 
      { status: 500 }
    );
  }
}