// src/app/api/auth/send-otp/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { rateLimit } from '@/lib/rate-limit'; // ★ Import Rate Limit

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';
const OTP_EXPIRY_MINUTES = 10;

export async function POST(request: NextRequest) {
  try {
    // ★ 1. Rate Limiting Check (3 requests per 60s)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    if (!rateLimit(ip, 3, 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const { email, name, phone } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'A valid email is required.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    // 2. Check if verified
    const existingVerifiedUser = await usersCollection.findOne({ email: email.toLowerCase(), isVerified: true });
    if (existingVerifiedUser) {
      return NextResponse.json({ success: false, error: 'This email is already registered and verified.' }, { status: 409 });
    }

    // 3. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // 4. Upsert Temporary User
    const temporaryUserData = {
      name: name || "",
      email: email.toLowerCase(),
      phone: phone || "",
      otp: otpHash,
      otpExpires,
      isVerified: false
    };

    await usersCollection.updateOne(
      { email: email.toLowerCase() },
      { $set: temporaryUserData, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    // 5. Send Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_EMAIL_ADDRESS,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #f4f7f6; }
          .email-container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0; }
          .header { background: #4CAF50; padding: 20px; text-align: center; color: white; }
          .content { padding: 30px; text-align: center; color: #333; }
          .otp-box { background: #f0fdf4; border: 2px dashed #4CAF50; border-radius: 10px; padding: 15px; display: inline-block; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #2e7d32; letter-spacing: 5px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header"><h1>Bumba's Kitchen</h1></div>
          <div class="content">
            <h3>Verify Your Email</h3>
            <p>Hi <strong>${name}</strong>, use the code below to complete registration.</p>
            <div class="otp-box"><div class="otp-code">${otp}</div></div>
            <p>Valid for 10 minutes.</p>
          </div>
          <div class="footer"><p>&copy; ${new Date().getFullYear()} Bumba's Kitchen</p></div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Bumba's Kitchen" <${process.env.SENDER_EMAIL_ADDRESS}>`,
      to: email,
      subject: `Your Verification Code: ${otp}`,
      html: emailHtml 
    });

    return NextResponse.json({ success: true, message: `OTP sent to ${email}` }, { status: 200 });

  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}