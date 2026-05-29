// src/app/api/auth/me/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils'; 

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
    
    const userId = payload._id || payload.id;
    
    const user = await db.collection(COLLECTION_NAME).findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } } 
    );

    if (!user) {
        return NextResponse.json({ success: false, user: null }, { status: 404 });
    }

    // ৩. রেসপন্স পাঠানো (★ এখানেই dob আর anniversary অ্যাড করা হলো)
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
            wallet: user.wallet,
            dob: user.dob,               // ★ Added
            anniversary: user.anniversary // ★ Added
        } 
    });

  } catch (error: any) {
    console.error("Auth Check Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}