// src/app/api/auth/me/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyUser } from '@/lib/auth-utils';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';

export async function GET(request: NextRequest) {
  try {
    // ✅ Verify from Cookie (Not header)
    const decoded = await verifyUser(request);

    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const user = await db.collection(COLLECTION_NAME).findOne(
        { _id: new ObjectId(decoded._id) },
        { projection: { password: 0, otp: 0 } }
    );

    if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

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
        wallet: user.wallet
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}