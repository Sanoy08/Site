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
    if (!NTFY_TOPIC) return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const body = await request.json();
    const validation = sendOtpSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ success: false, error: validation.error.errors[0].message }, { status: 400 });
    
    const { phone, name } = validation.data;
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // ★★★ BOT & SPAM PROTECTION ★★★
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const otpLogsCollection = db.collection('otp_logs');

    const ipLogs = await otpLogsCollection.find({ ip, createdAt: { $gte: twentyFourHoursAgo } }).sort({createdAt: -1}).toArray();
    if (ipLogs.length >= 5) {
        const resetTime = new Date(ipLogs[0].createdAt.getTime() + 24 * 60 * 60 * 1000);
        return NextResponse.json({ success: false, isBlocked: true, resetTime, error: 'Too many requests from this device.' }, { status: 429 });
    }

    const phoneLogs = await otpLogsCollection.find({ phone, createdAt: { $gte: twentyFourHoursAgo } }).sort({createdAt: -1}).toArray();
    if (phoneLogs.length >= 3) {
        const resetTime = new Date(phoneLogs[0].createdAt.getTime() + 24 * 60 * 60 * 1000);
        return NextResponse.json({ success: false, isBlocked: true, resetTime, error: `Limit reached for +91 ${phone}.` }, { status: 429 });
    }

    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.findOne({ phone });

    if (!name && !existingUser) return NextResponse.json({ success: false, error: 'Account not found. Please Register first.' }, { status: 404 });
    if (name && existingUser) return NextResponse.json({ success: false, error: 'Account already exists. Please Login.' }, { status: 409 });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    const updateFields: any = { phone, otp: otpHash, otpExpires, updatedAt: new Date() };
    if (name) updateFields.name = name;

    const setOnInsert: any = {
        createdAt: new Date(), isVerified: false, role: 'customer', wallet: { currentBalance: 0, tier: "Bronze" }, email: `${phone}@no-email.com`
    };

    await usersCollection.updateOne({ phone }, { $set: updateFields, $setOnInsert: setOnInsert }, { upsert: true });

    await otpLogsCollection.insertOne({ ip, phone, createdAt: new Date() });

    // Ekhane tomara actual Hash ta boshao jeta Logcat e peyechhile
const APP_HASH = "kcc8QKYFrD"; 

// Message ta erokom hoye jabe
const message = `<#> Your Bumba's Kitchen OTP is: ${otp}. Valid for 10 mins. ${APP_HASH}`;
    try {
        await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
            method: 'POST', body: message, headers: { 'Title': phone, 'Priority': 'high', 'Tags': 'sms' }
        });
    } catch (e) {}

    return NextResponse.json({ success: true, message: 'OTP sent successfully.' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}