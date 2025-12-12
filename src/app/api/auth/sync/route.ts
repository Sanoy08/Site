import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAuth } from '@/lib/firebase-admin';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify the Firebase User
    const decodedUser = await verifyAuth(request);
    if (!decodedUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { uid, email, name, picture } = await request.json();

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    // 2. Find or Create User in MongoDB
    const result = await usersCollection.findOneAndUpdate(
      { email: email }, // Search by email
      {
        $set: {
          uid: uid, // Link Firebase UID
          email: email,
          name: name || decodedUser.name || 'User',
          picture: picture || decodedUser.picture,
          lastLogin: new Date(),
        },
        $setOnInsert: {
          role: 'customer', // Default role
          createdAt: new Date(),
          wallet: { currentBalance: 0, tier: "Bronze" }
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({ 
      success: true, 
      user: {
        id: result._id.toString(),
        uid: uid,
        role: result.role,
        name: result.name,
        email: result.email
      } 
    });

  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}