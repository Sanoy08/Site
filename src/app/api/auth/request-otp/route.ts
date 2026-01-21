import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb'; // আপনার DB কানেকশন পাথ
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    // ৬ ডিজিটের ইউনিক কোড জেনারেট
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const requestId = crypto.randomUUID();

    // DB তে সেভ করা (Pending অবস্থায়)
    await db.collection('otp_requests').insertOne({
      requestId,
      phone, // ইউজারের ইনপুট দেওয়া ফোন নম্বর
      otpCode,
      status: 'PENDING',
      createdAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      requestId, 
      otpCode, 
      targetPhone: process.env.ADMIN_PHONE_NUMBER // আপনার অ্যাডমিন সিমের নম্বর (.env তে রাখবেন)
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}