// src/app/api/auth/firebase-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { auth as adminAuth } from '@/lib/firebase-admin'; // Ensure this exports admin.auth()
import jwt from 'jsonwebtoken';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_change_me';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 400 });
    }

    // 1. Verify the Firebase Token securely on the server
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { email, name, picture, uid } = decodedToken;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    // 2. Find user in MongoDB
    let user = await usersCollection.findOne({ email: email.toLowerCase() });

    // 3. If user doesn't exist, create them (Auto-Signup)
    if (!user) {
      const newUser = {
        name: name || 'User',
        email: email.toLowerCase(),
        image: picture,
        firebaseUid: uid, // Link Firebase ID
        role: 'customer',
        isVerified: true, // Google/Firebase verified this
        createdAt: new Date(),
        wallet: { currentBalance: 0, tier: "Bronze" }
      };
      
      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else {
      // Optional: Update Firebase UID if missing
      if (!user.firebaseUid) {
        await usersCollection.updateOne(
          { _id: user._id }, 
          { $set: { firebaseUid: uid, isVerified: true } }
        );
      }
    }

    // 4. Generate YOUR EXISTING APP TOKEN
    // This ensures use-auth.ts and the rest of the app works exactly as before
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
        phone: user.phone,
        address: user.address,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Firebase Login Error:", error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed.' },
      { status: 500 }
    );
  }
}