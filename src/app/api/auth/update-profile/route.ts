// src/app/api/auth/update-profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils'; 

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';

export async function PUT(request: NextRequest) {
  try {
    // ১. কুকি থেকে ইউজার ভেরিফিকেশন
    const currentUser = await getUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, dob, anniversary } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ success: false, error: 'First and Last name are required.' }, { status: 400 });
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    // ২. বর্তমান ইউজার ডেটা আনা
    const userId = currentUser._id || currentUser.id;
    const currentDbUser = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!currentDbUser) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // ৩. আপডেট অবজেক্ট তৈরি
    const updateDoc: any = {
        name: fullName,
        updatedAt: new Date(),
    };

    // ★★★ Birthday Check (একবার সেট হলে আর বদলানো যাবে না)
    if (!currentDbUser.dob && dob) {
        updateDoc.dob = dob;
    } else if (currentDbUser.dob && dob && currentDbUser.dob !== dob) {
        // ইউজার বদলাতে চাইলে আমরা ইগনোর করব এবং ওয়ার্নিং লগ করব
        console.warn(`User ${userId} tried to change DOB from ${currentDbUser.dob} to ${dob}`);
    }

    // ★★★ Anniversary Check (একবার সেট হলে আর বদলানো যাবে না)
    if (!currentDbUser.anniversary && anniversary) {
        updateDoc.anniversary = anniversary;
    } else if (currentDbUser.anniversary && anniversary && currentDbUser.anniversary !== anniversary) {
        console.warn(`User ${userId} tried to change Anniversary from ${currentDbUser.anniversary} to ${anniversary}`);
    }

    // ৪. ডাটাবেস আপডেট
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    if (!result) {
        return NextResponse.json({ success: false, error: 'Failed to update profile.' }, { status: 500 });
    }

    const updatedUser = result;
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        // আমরা ইমেল পাঠাচ্ছি যাতে টাইপ এরর না হয়, কিন্তু ফ্রন্টএন্ড এটা দেখাবে না
        email: updatedUser.email, 
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address,
        picture: updatedUser.picture,
        dob: updatedUser.dob,
        anniversary: updatedUser.anniversary
      }
    });

  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}