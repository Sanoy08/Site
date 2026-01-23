// src/app/api/auth/change-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getUser } from '@/lib/auth-utils'; // ★★★ কুকি থেকে ইউজার পাওয়ার ফাংশন

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';

export async function POST(request: NextRequest) {
  try {
    // ১. ★★★ কুকি থেকে ইউজার ভেরিফিকেশন
    const currentUser = await getUser(request);
    if (!currentUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
        return NextResponse.json({ success: false, error: 'All fields are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'New password must be at least 6 characters.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    // currentUser._id বা currentUser.id যেটা Auth Utils রিটার্ন করে সেটা ব্যবহার করুন
    const userId = currentUser._id || currentUser.id; 

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // বর্তমান পাসওয়ার্ড চেক করা
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return NextResponse.json({ success: false, error: 'Incorrect current password.' }, { status: 400 });
    }

    // নতুন পাসওয়ার্ড হ্যাশ করে সেভ করা
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { password: hashedPassword } }
    );

    return NextResponse.json({ success: true, message: 'Password changed successfully!' });

  } catch (error: any) {
    console.error("Password Change Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}