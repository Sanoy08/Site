// src/app/api/auth/me/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils'; 

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ১. কুকি থেকে ইউজার ডেটা আনা
    const payload = await getUser(request);

    if (!payload) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    // ২. অপ্টিমাইজড ডাটাবেস কল (শুধু প্রয়োজনীয় ফিল্ড আনা হচ্ছে)
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    const userId = payload._id || payload.id;
    
    // ★ Projection: পুরো ইউজার অবজেক্ট না এনে শুধু যেগুলো ফ্রন্টএন্ডে দরকার সেগুলো আনছি
    const user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { name: 1, email: 1, role: 1, picture: 1, phone: 1, address: 1, wallet: 1 } }
    );

    if (!user) {
        return NextResponse.json({ success: false, user: null }, { status: 404 });
    }

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