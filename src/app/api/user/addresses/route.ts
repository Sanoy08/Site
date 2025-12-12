// src/app/api/user/addresses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/firebase-admin';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';

// Helper to get MongoDB User ID
async function getUserId(request: NextRequest) {
  const decodedToken = await verifyAuth(request);
  if (!decodedToken) return null;

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
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
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const user = await db.collection(COLLECTION_NAME).findOne(
        { _id: new ObjectId(userId) },
        { projection: { savedAddresses: 1 } }
    );

    return NextResponse.json({ 
        success: true, 
        addresses: user?.savedAddresses || [] 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, address, isDefault } = body;

    if (!name || !address) {
        return NextResponse.json({ error: 'Name and Address required' }, { status: 400 });
    }

    const newAddress = {
        id: new ObjectId().toString(),
        name,
        address,
        isDefault: isDefault || false
    };

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    if (isDefault) {
        await db.collection(COLLECTION_NAME).updateOne(
            { _id: new ObjectId(userId), "savedAddresses.isDefault": true },
            { $set: { "savedAddresses.$[elem].isDefault": false } },
            { arrayFilters: [{ "elem.isDefault": true }] }
        );
    }

    await db.collection(COLLECTION_NAME).updateOne(
        { _id: new ObjectId(userId) },
        { $push: { savedAddresses: newAddress } as any }
    );

    return NextResponse.json({ success: true, message: 'Address added', address: newAddress });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT Method (Edit)
export async function PUT(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { id, name, address, isDefault } = body;

        if (!id || !name || !address) {
            return NextResponse.json({ error: 'ID, Name and Address required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        if (isDefault) {
            await db.collection(COLLECTION_NAME).updateOne(
                { _id: new ObjectId(userId), "savedAddresses.isDefault": true },
                { $set: { "savedAddresses.$[elem].isDefault": false } },
                { arrayFilters: [{ "elem.isDefault": true }] }
            );
        }

        await db.collection(COLLECTION_NAME).updateOne(
            { _id: new ObjectId(userId), "savedAddresses.id": id },
            { 
                $set: { 
                    "savedAddresses.$.name": name,
                    "savedAddresses.$.address": address,
                    "savedAddresses.$.isDefault": isDefault
                } 
            }
        );

        return NextResponse.json({ success: true, message: 'Address updated' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const addressId = searchParams.get('id');

        if (!addressId) return NextResponse.json({ error: 'Address ID required' }, { status: 400 });

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        await db.collection(COLLECTION_NAME).updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { savedAddresses: { id: addressId } } as any }
        );

        return NextResponse.json({ success: true, message: 'Address deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}