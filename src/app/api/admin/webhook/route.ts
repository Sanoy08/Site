import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sender = searchParams.get('sender'); // SMS Sender (User's Phone)
  const message = searchParams.get('message'); // SMS Body
  const secret = searchParams.get('secret'); // Security Key

  // ১. সিকিউরিটি চেক
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ২. মেসেজ থেকে OTP বের করা (Regex)
  const otpMatch = message?.match(/VERIFY-(\d{6})/);
  if (!otpMatch || !sender) return NextResponse.json({ error: 'Invalid Format' });

  const extractedOtp = otpMatch[1];
  
  // ৩. DB চেক: এই OTP টি কি এই Sender নম্বর থেকেই আসার কথা ছিল?
  const client = await clientPromise;
  const db = client.db('BumbasKitchenDB');

  const request = await db.collection('otp_requests').findOne({ 
    otpCode: extractedOtp,
    status: 'PENDING'
  });

  if (!request) return NextResponse.json({ error: 'Request not found' });

  // ★★★ CRITICAL CHECK: User Input Phone === SMS Sender Phone ★★★
  // নম্বর ফরম্যাট ক্লিন করা (স্পেস, +৯১ বাদে শেষ ১০ ডিজিট মেলানো)
  const cleanDbPhone = request.phone.slice(-10);
  const cleanSenderPhone = sender.slice(-10);

  if (cleanDbPhone === cleanSenderPhone) {
    // ভেরিফিকেশন সাকসেস! স্ট্যাটাস APPROVED করে দিলাম
    await db.collection('otp_requests').updateOne(
      { _id: request._id },
      { $set: { status: 'APPROVED' } }
    );
    return NextResponse.json({ success: true, message: 'Login Approved' });
  } else {
    return NextResponse.json({ error: 'Phone number mismatch' });
  }
}