// src/app/api/admin/coupons/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils'; // ★★★ কুকি চেকার

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'coupons';

export async function GET(request: NextRequest) {
  try {
    // ১. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const coupons = await db.collection(COLLECTION_NAME).find({}).toArray();

    const formattedCoupons = coupons.map(c => ({
      id: c._id.toString(),
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      value: c.value,
      minOrder: c.minOrder,
      usageLimit: c.usageLimit,
      startDate: c.startDate,
      expiryDate: c.expiryDate,
      isActive: c.isActive,
      timesUsed: c.timesUsed || 0,
      isOneTime: c.isOneTime || false // ফ্রন্টএন্ডে দেখানোর জন্য
    }));

    return NextResponse.json({ success: true, coupons: formattedCoupons }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // ২. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const existingCoupon = await db.collection(COLLECTION_NAME).findOne({ code: body.code.toUpperCase() });
    if (existingCoupon) {
        return NextResponse.json({ success: false, error: 'Coupon code already exists' }, { status: 400 });
    }

    // আনলিমিটেড লজিক
    const usageLimit = body.usageLimit ? parseInt(body.usageLimit) : 0; // 0 means unlimited
    const expiryDate = body.expiryDate ? body.expiryDate : null; // null means unlimited time

    const newCoupon = {
      code: body.code.toUpperCase(),
      description: body.description,
      discountType: body.discountType,
      value: parseFloat(body.value),
      minOrder: parseFloat(body.minOrder || 0),
      usageLimit: usageLimit,
      startDate: body.startDate,
      expiryDate: expiryDate,
      isActive: body.isActive ?? true,
      
      // ★★★ FIX: isOneTime এবং userId সাপোর্ট যোগ করা হলো
      isOneTime: body.isOneTime || false, 
      userId: body.userId ? body.userId : null, // যদি কোনো স্পেসিফিক ইউজারের জন্য হয়

      timesUsed: 0, 
      createdAt: new Date()
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(newCoupon);

    if (result.acknowledged) {
      return NextResponse.json({ success: true, message: 'Coupon created', couponId: result.insertedId }, { status: 201 });
    } else {
      throw new Error('Failed to create coupon');
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}