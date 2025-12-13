// src/app/api/auth/google/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state'); 
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const REDIRECT_URI = `${APP_URL}/api/auth/google/callback`;

  // 1. Platform Detection
  let platform = 'web';
  try {
      if (stateParam) {
          const parsedState = JSON.parse(stateParam);
          platform = parsedState.platform || 'web';
      }
  } catch (e) {
      console.warn("Failed to parse state", e);
  }

  // Helper function for redirecting
  const redirect = (url: string, error?: string) => {
      if (platform === 'app') {
          // If App: Redirect to Custom Scheme
           // If error, append it
          const finalUrl = error 
            ? `bumbaskitchen://google-callback?error=${encodeURIComponent(error)}`
            : url;
          return NextResponse.redirect(finalUrl);
      } else {
          // If Web: Redirect to HTTPS
          const finalUrl = error 
            ? `${APP_URL}/login?error=${encodeURIComponent(error)}`
            : url;
          return NextResponse.redirect(finalUrl);
      }
  };

  if (!code) {
    return redirect('', 'No code provided');
  }

  try {
    // 2. Exchange Code for Token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || 'Token exchange failed');

    // 3. Get User Info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    // 4. Database Logic
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    let user = await usersCollection.findOne({ email: googleUser.email.toLowerCase() });

    if (!user) {
      const newUser = {
        name: googleUser.name,
        email: googleUser.email.toLowerCase(),
        isVerified: true,
        createdAt: new Date(),
        role: "customer",
        picture: googleUser.picture,
        wallet: { currentBalance: 0, tier: "Bronze" }
      };
      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else {
      await usersCollection.updateOne({ _id: user._id }, { $set: { picture: googleUser.picture } });
      user.picture = googleUser.picture;
    }

    // 5. Generate Token
    const userPayload = {
        id: user._id.toString(), 
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture
    };

    const appToken = jwt.sign(
        { _id: user._id.toString(), email: user.email, role: user.role }, 
        JWT_SECRET, 
        { expiresIn: '30d' }
    );

    const encodedToken = encodeURIComponent(appToken);
    const encodedUser = encodeURIComponent(JSON.stringify(userPayload));

    // 6. Success Redirect
    if (platform === 'app') {
         return NextResponse.redirect(`bumbaskitchen://google-callback?token=${encodedToken}&user=${encodedUser}`);
    } else {
         return NextResponse.redirect(`${APP_URL}/google-callback?token=${encodedToken}&user=${encodedUser}`);
    }

  } catch (error: any) {
    console.error("Google Login Error:", error);
    return redirect('', error.message || 'Login failed');
  }
}