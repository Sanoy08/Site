// src/app/api/delivery/deposit-request/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { sendNotificationToAdmins } from '@/lib/notification';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader!.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    const client = await clientPromise;
    
    // এখানে আপনি চাইলে একটি 'deposit_requests' কালেকশনে রিকোয়েস্ট সেভ করতে পারেন
    // আপাতত আমরা জাস্ট অ্যাডমিনকে নোটিফিকেশন পাঠাচ্ছি
    
    await sendNotificationToAdmins(
        client, 
        "Cash Deposit Request 💰", 
        `${decoded.name} wants to deposit cash. Check dashboard.`,
        "/admin/users" // Or a specific finance page
    );

    return NextResponse.json({ success: true });
}