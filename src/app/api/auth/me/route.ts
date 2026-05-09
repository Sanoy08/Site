// src/app/api/auth/me/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils'; 

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const payload = await getUser(request);

    if (!payload) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const userId = payload._id || payload.id;
    
    // ১. ইউজার কালেকশন থেকে ডেটা আনা
    const user = await db.collection(COLLECTION_NAME).findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } } 
    );

    if (!user) {
        return NextResponse.json({ success: false, user: null }, { status: 404 });
    }

    let dob = user.dob || null;
    let anniversary = user.anniversary || null;

    // ২. ★★★ specialdates কালেকশন থেকে ডেটা খোঁজা ★★★
    // আমরা নাম দিয়ে (case-insensitive) খুঁজছি, কারণ আপনার স্যাম্পল ডেটাতে userId নেই, title (name) আছে
    const specialDates = await db.collection('specialdates').find({
        $or: [
            { userId: userId }, 
            { title: { $regex: new RegExp(`^${user.name.trim()}$`, 'i') } } 
        ]
    }).toArray();

    if (specialDates && specialDates.length > 0) {
        const bdayEntry = specialDates.find(d => d.type === 'birthday');
        const annivEntry = specialDates.find(d => d.type === 'anniversary');

        if (bdayEntry && !dob) {
            const d = new Date(bdayEntry.date);
            dob = d.toISOString().split('T')[0]; // "YYYY-MM-DD" ফরম্যাটে কনভার্ট
        }
        if (annivEntry && !anniversary) {
            const d = new Date(annivEntry.date);
            anniversary = d.toISOString().split('T')[0]; // "YYYY-MM-DD" ফরম্যাটে কনভার্ট
        }
    }

    return NextResponse.json({ 
        success: true, 
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            picture: user.picture,
            phone: user.phone,
            address: user.address,
            wallet: user.wallet,
            dob: dob,                 // specialdates থেকে পাওয়া বা ইউজার টেবিল থেকে পাওয়া ডেটা
            anniversary: anniversary  // specialdates থেকে পাওয়া বা ইউজার টেবিল থেকে পাওয়া ডেটা
        } 
    });

  } catch (error: any) {
    console.error("Auth Check Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}