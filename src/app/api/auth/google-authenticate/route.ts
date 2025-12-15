import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ success: false, error: 'ID Token required' }, { status: 400 });
    }

    // 1. Verify the Google ID Token
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error("Invalid Google Token payload");
    }

    // 2. Database Logic (Preserved from your callback route)
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    let user = await usersCollection.findOne({ email: payload.email.toLowerCase() });

    if (!user) {
      // New User
      const newUser = {
        name: payload.name || payload.given_name || 'User',
        email: payload.email.toLowerCase(),
        isVerified: true,
        createdAt: new Date(),
        role: "customer",
        picture: payload.picture,
        wallet: { currentBalance: 0, tier: "Bronze" }
      };
      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else {
      // Existing User - Update Picture
      if (payload.picture && user.picture !== payload.picture) {
        await usersCollection.updateOne(
          { _id: user._id }, 
          { $set: { picture: payload.picture } }
        );
        user.picture = payload.picture;
      }
    }

    // 3. Generate App JWT (Preserved logic)
    const userPayload = {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      picture: user.picture
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '30d' });

    // 4. Return Success
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        picture: user.picture
      }
    });

  } catch (error: any) {
    console.error("Google Auth Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication failed' },
      { status: 401 }
    );
  }
}