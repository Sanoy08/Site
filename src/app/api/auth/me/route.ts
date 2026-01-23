// src/app/api/auth/me/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils'; // ★★★ Fix: verifyUser -> getUser

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ১. কুকি থেকে ইউজার ডেটা (Payload) আনা
    const payload = await getUser(request);

    if (!payload) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // ২. ডাটাবেস থেকে ফ্রেশ ডেটা আনা (যাতে রোল বা অন্যান্য তথ্য আপডেটেড থাকে)
    // payload._id বা payload.id দুটোই চেক করা হচ্ছে সেইফটির জন্য
    const userId = payload._id || payload.id;
    
    const user = await db.collection(COLLECTION_NAME).findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } } // পাসওয়ার্ড বাদ দিয়ে
    );

    if (!user) {
        return NextResponse.json({ success: false, user: null }, { status: 404 });
    }

    // ৩. রেসপন্স পাঠানো
    return NextResponse.json({ 
        success: true, 
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            picture: user.picture,
            phone: user.phone,
            address: user.address,
            wallet: user.wallet
        } 
    });

  } catch (error: any) {
    console.error("Auth Check Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}