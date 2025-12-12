// src/app/api/auth/google/mobile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    // 1. Verify the Google Token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload) throw new Error("Invalid token");

    // 2. Create your app's session token (JWT)
    // Adjust this to match your existing logic in /api/auth/login
    const user = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      role: 'user', // Default role
    };

    const token = jwt.sign(user, process.env.JWT_SECRET || 'default_secret', { expiresIn: '7d' });

    // 3. Set the cookie and return success
    const response = NextResponse.json({ success: true, user });
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

  } catch (error: any) {
    console.error("Mobile Login Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}