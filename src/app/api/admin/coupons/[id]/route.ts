// src/app/api/admin/coupons/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAdmin } from '@/lib/auth-utils'; // ★★★ কুকি চেকার ইম্পোর্ট

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'coupons';

// ★★★ কুপন আপডেট করার জন্য PUT মেথড ★★★
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ১. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // আনলিমিটেড লজিক: যদি ফাঁকা বা ০ হয়, তবে null বা 0 সেট হবে
    const usageLimit = body.usageLimit ? parseInt(body.usageLimit) : 0; // 0 means unlimited
    const expiryDate = body.expiryDate ? body.expiryDate : null; // null means no expiry

    const updateData = {
      code: body.code.toUpperCase(),
      description: body.description,
      discountType: body.discountType,
      value: parseFloat(body.value),
      minOrder: parseFloat(body.minOrder || 0),
      usageLimit: usageLimit, 
      startDate: body.startDate,
      expiryDate: expiryDate,
      isActive: body.isActive
    };

    await db.collection(COLLECTION_NAME).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return NextResponse.json({ success: true, message: 'Coupon updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ২. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: 'Coupon deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}