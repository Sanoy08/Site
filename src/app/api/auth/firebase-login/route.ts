// src/app/api/auth/firebase-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { auth as adminAuth } from '@/lib/firebase-admin'; 
import jwt from 'jsonwebtoken';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_change_me';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ success: false, error: 'No ID token provided' }, { status: 400 });
    }

    console.log("Verifying token...");

    // 1. Verify the Firebase Token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (verifyError: any) {
      console.error("Token Verification Failed:", verifyError);
      return NextResponse.json({ 
        success: false, 
        error: `Token Error: ${verifyError.message}` 
      }, { status: 401 });
    }

    const { email, name, picture, uid } = decodedToken;
    console.log("Token verified for:", email);

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email required in token' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    // 2. Find or Create User
    let user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log("Creating new user...");
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

    // 3. Generate JWT
    const token = jwt.sign(
      { 
        _id: user._id.toString(), 
        email: user.email, 
        name: user.name, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Server Login Error:", error);
    // এই লাইনের কারণে আপনি আসল এররটা টোস্টে দেখতে পাবেন
    return NextResponse.json(
      { success: false, error: `Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}