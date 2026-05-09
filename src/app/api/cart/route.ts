// src/app/api/cart/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { pusherServer } from '@/lib/pusher';
import { getUser } from '@/lib/auth-utils'; // ★★★ কুকি চেকার

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';

export async function GET(request: NextRequest) {
  // ১. ★★★ কুকি থেকে ইউজার আইডি
  const currentUser = await getUser(request);
  const userId = currentUser?._id || currentUser?.id;

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
  // ২. ★★★ কুকি থেকে ইউজার আইডি
  const currentUser = await getUser(request);
  const userId = currentUser?._id || currentUser?.id;

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { items } = await request.json();

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // ১. ডাটাবেস আপডেট (Timestamp সহ)
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

    // ২. Pusher ট্রিগার
    await pusherServer.trigger(`user-${userId}`, 'cart-updated', {
        items: items
    });

    return NextResponse.json({ success: true, message: 'Cart synced' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}