// src/app/api/auth/google/native-login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
// Use the SAME Client ID you use in the frontend
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID; 

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ success: false, error: 'ID Token is required' }, { status: 400 });
    }

    // 1. Verify the Google ID Token
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID, 
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ success: false, error: 'Invalid token payload' }, { status: 401 });
    }

    const { email, name, picture } = payload;

    // 2. Connect to DB
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    // 3. Find or Create User (Login & Signup Logic combined)
    let user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      // --- SIGNUP LOGIC ---
      const newUser = {
        name: name,
        email: email.toLowerCase(),
        isVerified: true, // Google accounts are verified
        createdAt: new Date(),
        role: "customer",
        picture: picture,
        wallet: { currentBalance: 0, tier: "Bronze" }
      };
      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else {
      // --- LOGIN LOGIC (Update Info) ---
      await usersCollection.updateOne(
        { _id: user._id }, 
        { $set: { picture: picture } }
      );
      user.picture = picture;
    }

    // 4. Generate App Token
    const appToken = jwt.sign(
      { 
        _id: user._id.toString(), 
        email: user.email, 
        name: user.name, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // 5. Return success
    return NextResponse.json({
      success: true,
      token: appToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture
      }
    });

  } catch (error: any) {
    console.error("Native Google Login Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Login failed' }, { status: 500 });
  }
}