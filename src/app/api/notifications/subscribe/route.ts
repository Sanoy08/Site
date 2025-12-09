// src/app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'subscriptions';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export async function POST(request: NextRequest) {
  try {
    const { token, jwtToken } = await request.json(); // 'token' is the FCM token
    
    if (!token) return NextResponse.json({ success: false });

    let userId = null;
    if (jwtToken) {
      try {
        const decoded: any = jwt.verify(jwtToken, JWT_SECRET);
        userId = decoded._id;
      } catch (e) {
        console.warn("Invalid JWT during subscription");
      }
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Store token. If user logs in/out, we might want to update the userId field.
    await db.collection(COLLECTION_NAME).updateOne(
      { token: token },
      { 
          $set: { 
              token, 
              userId: userId ? new ObjectId(userId) : null,
              updatedAt: new Date(),
              platform: 'android' 
          } 
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}