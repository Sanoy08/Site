// src/app/api/auth/firebase-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { auth as adminAuth } from '@/lib/firebase-admin'; 
import jwt from 'jsonwebtoken';
import { responseWithCookie } from '@/lib/auth-utils';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';
const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) return NextResponse.json({ success: false, error: 'No token' }, { status: 400 });

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { email, name, picture, uid } = decodedToken;

    if (!email) return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    let user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      const newUser = {
        name: name || 'User',
        email: email.toLowerCase(),
        image: picture,
        firebaseUid: uid,
        role: 'customer',
        isVerified: true,
        createdAt: new Date(),
        wallet: { currentBalance: 0, tier: "Bronze" }
      };
      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }

    const token = jwt.sign(
      { _id: user._id.toString(), email: user.email, name: user.name, role: user.role || 'customer' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // ✅ Set Cookie
    return responseWithCookie(
        { success: true, user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role, image: user.image } },
        token
    );

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}