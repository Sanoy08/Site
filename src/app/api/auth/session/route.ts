// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authAdmin } from '@/lib/firebase-admin';
import { clientPromise } from '@/lib/mongodb';
import { createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID Token required' }, { status: 400 });
    }

    // ১. Firebase টোকেন ভেরিফাই করা
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // ২. MongoDB তে কানেক্ট করা
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    const usersCollection = db.collection('users');

    // ৩. ইউজার চেক বা আপডেট করা (Upsert Logic)
    // আমরা ইমেইল দিয়ে চেক করব যেন পুরনো অ্যাকাউন্ট থাকলেও লিঙ্ক হয়ে যায়
    let user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      // নতুন ইউজার তৈরি
      const newUser = {
        name: name || 'New User',
        email: email.toLowerCase(),
        firebaseUid: uid, // Firebase এর সাথে লিঙ্ক
        role: 'customer',
        picture: picture || '',
        isVerified: true, // Firebase থেকে আসা মানেই ভেরিফাইড
        wallet: { currentBalance: 0, tier: 'Bronze' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else {
      // বিদ্যমান ইউজার আপডেট (Firebase UID লিঙ্ক করা)
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            firebaseUid: uid,
            picture: picture || user.picture,
            updatedAt: new Date(),
            isVerified: true 
          } 
        }
      );
    }

    // ৪. সেশন কুকি তৈরি করা
    await createSession(user._id.toString(), user.role || 'customer');

    return NextResponse.json({ success: true, user });

  } catch (error: any) {
    console.error('Session Error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}