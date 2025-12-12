// src/app/api/cart/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/firebase-admin';
import { pusherServer } from '@/lib/pusher';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';

// Helper to get MongoDB User ID from Firebase Token
async function getUserId(request: NextRequest) {
  const decodedToken = await verifyAuth(request);
  if (!decodedToken) return null;

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    // Find the user document to get the MongoDB _id
    const user = await db.collection(COLLECTION_NAME).findOne({
      $or: [{ uid: decodedToken.uid }, { email: decodedToken.email }]
    });
    return user?._id.toString();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ items: [] });

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const user = await db.collection(COLLECTION_NAME).findOne(
        { _id: new ObjectId(userId) },
        { projection: { cart: 1 } }
    );

    return NextResponse.json({ 
        success: true, 
        items: user?.cart || [] 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { items } = await request.json();

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // 1. Update Database
    await db.collection(COLLECTION_NAME).updateOne(
        { _id: new ObjectId(userId) },
        { 
            $set: { 
                cart: items,
                cartUpdatedAt: new Date(),
                abandonedCartNotified: false
            } 
        }
    );

    // 2. Trigger Pusher
    await pusherServer.trigger(`user-${userId}`, 'cart-updated', {
        items: items
    });

    return NextResponse.json({ success: true, message: 'Cart synced' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}