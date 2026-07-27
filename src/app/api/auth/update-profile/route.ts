// src/app/api/auth/update-profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils'; 

import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  dob: z.string().optional(),
  anniversary: z.string().optional()
});

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.errors[0].message }, { status: 400 });
    }

    const { firstName, lastName, dob, anniversary } = validation.data;
    
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    const userId = currentUser._id || currentUser.id;
    const currentDbUser = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!currentDbUser) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const updateDoc: any = {
        name: fullName,
        updatedAt: new Date(),
    };

    if (!currentDbUser.dob && dob) {
        updateDoc.dob = dob;
    } else if (currentDbUser.dob && dob && currentDbUser.dob !== dob) {
        console.warn(`User ${userId} tried to change DOB from ${currentDbUser.dob} to ${dob}`);
    }

    if (!currentDbUser.anniversary && anniversary) {
        updateDoc.anniversary = anniversary;
    } else if (currentDbUser.anniversary && anniversary && currentDbUser.anniversary !== anniversary) {
        console.warn(`User ${userId} tried to change Anniversary from ${currentDbUser.anniversary} to ${anniversary}`);
    }

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
        dob: updatedUser.dob,
        anniversary: updatedUser.anniversary,
        savedAddresses: updatedUser.savedAddresses || [] // ★ Added
      }
    });

  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}