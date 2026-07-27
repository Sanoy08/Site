// src/app/api/user/addresses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';

async function getUserId(request: NextRequest) {
    const user = await getUser(request);
    return user ? (user._id || user.id) : null;
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
    const { name, address, isDefault, coordinates, distanceText, deliveryFee } = body;

    if (!name || !address || !coordinates) {
        return NextResponse.json({ error: 'Label, Address and Map Location required' }, { status: 400 });
    }

    const newAddress = {
        id: new ObjectId().toString(),
        name,
        address,
        isDefault: isDefault || false,
        coordinates,
        distanceText: distanceText || '',
        deliveryFee: Math.max(0, Number(deliveryFee) || 0)
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

export async function PUT(request: NextRequest) {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { id, name, address, isDefault, coordinates, distanceText, deliveryFee } = body;

        if (!id || !name || !address || !coordinates) {
            return NextResponse.json({ error: 'ID, Label, Address and Location required' }, { status: 400 });
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
                    "savedAddresses.$.isDefault": isDefault,
                    "savedAddresses.$.coordinates": coordinates,
                    "savedAddresses.$.distanceText": distanceText || '',
                    "savedAddresses.$.deliveryFee": Math.max(0, Number(deliveryFee) || 0)
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