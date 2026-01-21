import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import jwt from 'jsonwebtoken'; // JWT টোকেন জেনারেট করার জন্য

export async function POST(req: Request) {
  const { requestId } = await req.json();
  const client = await clientPromise;
  const db = client.db('BumbasKitchenDB');

  const request = await db.collection('otp_requests').findOne({ requestId });

  if (request && request.status === 'APPROVED') {
    // ১. ইউজারকে লগইন করানো (যদি ইউজার না থাকে, সাইন আপ করে নিন)
    let user = await db.collection('users').findOne({ phone: request.phone });
    
    if (!user) {
       // নতুন ইউজার তৈরি
       const newUser = { phone: request.phone, role: 'user', createdAt: new Date() };
       const res = await db.collection('users').insertOne(newUser);
       user = { _id: res.insertedId, ...newUser };
    }

    // ২. JWT টোকেন তৈরি
    const token = jwt.sign(
        { userId: user._id, role: user.role }, 
        process.env.JWT_SECRET || 'secret', 
        { expiresIn: '7d' }
    );

    // ৩. রিকোয়েস্ট ডিলিট করে দিন (ক্লিনআপ)
    await db.collection('otp_requests').deleteOne({ requestId });

    return NextResponse.json({ success: true, token, user });
  }

  return NextResponse.json({ success: false, status: 'PENDING' });
}