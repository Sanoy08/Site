// src/app/api/auth/update-profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils'; 

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';

export async function PUT(request: NextRequest) {
  try {
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
    const specialDatesCollection = db.collection('specialdates');

    const userId = currentUser._id || currentUser.id;
    const currentDbUser = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!currentDbUser) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const updateDoc: any = {
        name: fullName,
        updatedAt: new Date(),
    };

    // ★★★ Birthday Check & specialdates Update ★★★
    if (!currentDbUser.dob && dob) {
        updateDoc.dob = dob;
        await specialDatesCollection.updateOne(
            { title: fullName, type: 'birthday' },
            { 
              $set: { 
                  title: fullName, 
                  date: new Date(dob), 
                  type: 'birthday',
                  userId: userId 
              },
              $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );
    } 

    // ★★★ Anniversary Check & specialdates Update ★★★
    if (!currentDbUser.anniversary && anniversary) {
        updateDoc.anniversary = anniversary;
        await specialDatesCollection.updateOne(
            { title: fullName, type: 'anniversary' },
            { 
              $set: { 
                  title: fullName, 
                  date: new Date(anniversary), 
                  type: 'anniversary',
                  userId: userId 
              },
              $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );
    }

    // ৪. ইউজার ডাটাবেস আপডেট
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
        email: updatedUser.email, 
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address,
        picture: updatedUser.picture,
        dob: updatedUser.dob || dob,
        anniversary: updatedUser.anniversary || anniversary
      }
    });

  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}