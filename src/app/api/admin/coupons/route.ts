// src/app/api/admin/coupons/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-helper'; // ধাপ ১ এর ফাইল ইম্পোর্ট
import { z } from 'zod'; // Zod ভ্যালিডেশন

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'coupons';

// Zod Schema for Coupon (ইনপুট ভ্যালিডেশন)
const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 chars"),
  description: z.string().optional(),
  discountType: z.enum(['flat', 'percent']), // শুধু এই দুই টাইপ এলাউড
  value: z.number().positive("Value must be positive"),
  minOrder: z.number().min(0).optional(),
  usageLimit: z.number().min(0).optional(),
  startDate: z.string().datetime().optional(), // ISO Date String হতে হবে
  expiryDate: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // 🔒 SECURITY FIX: অ্যাডমিন চেক যোগ করা হয়েছে
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const coupons = await db.collection(COLLECTION_NAME).find({}).sort({ createdAt: -1 }).toArray();

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
      timesUsed: c.timesUsed || 0
    }));

    return NextResponse.json({ success: true, coupons: formattedCoupons }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 অ্যাডমিন চেক
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // 🛡️ ইনপুট ভ্যালিডেশন (Zod)
    // ক্লায়েন্ট স্ট্রিং পাঠালেও আমরা নাম্বারে কনভার্ট করে নিচ্ছি ভ্যালিডেশনের আগে
    const parseBody = {
        ...body,
        value: Number(body.value),
        minOrder: body.minOrder ? Number(body.minOrder) : 0,
        usageLimit: body.usageLimit ? Number(body.usageLimit) : 0
    };

    const validation = couponSchema.safeParse(parseBody);

    if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error.errors[0].message }, { status: 400 });
    }

    const validData = validation.data;

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // ডুপ্লিকেট চেক
    const existingCoupon = await db.collection(COLLECTION_NAME).findOne({ code: validData.code.toUpperCase() });
    if (existingCoupon) {
        return NextResponse.json({ success: false, error: 'Coupon code already exists' }, { status: 400 });
    }

    const newCoupon = {
      code: validData.code.toUpperCase(),
      description: validData.description || '',
      discountType: validData.discountType,
      value: validData.value,
      minOrder: validData.minOrder || 0,
      usageLimit: validData.usageLimit || 0, // 0 implies unlimited
      startDate: validData.startDate || new Date().toISOString(),
      expiryDate: validData.expiryDate || null,
      isActive: validData.isActive ?? true,
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