// src/app/api/auth/me/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getSession } from '@/lib/session'; // নতুন সেশন লজিক

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';

export async function GET(request: NextRequest) {
  try {
    // ১. কুকি থেকে সেশন চেক করা (আগের মতো হেডার পার্স করার দরকার নেই)
    const session = await getSession();

    // যদি সেশন না থাকে, তবে 401 বা null ইউজার রিটার্ন করি
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized', user: null }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // ২. ডাটাবেস থেকে ইউজার খুঁজে বের করা
    const user = await db.collection(COLLECTION_NAME).findOne(
        { _id: new ObjectId(session.userId as string) },
        { projection: { password: 0, otp: 0, otpExpires: 0 } } // সেন্সিটিভ ডাটা বাদ
    );

    if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // ৩. ইউজারের তথ্য রিটার্ন করা
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        picture: user.picture,
        dob: user.dob,             
        anniversary: user.anniversary,
        wallet: user.wallet // ওয়ালেট ইনফো অ্যাড করা হলো
      }
    });

  } catch (error: any) {
    console.error("Auth Me API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}