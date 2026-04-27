// src/app/api/admin/seed-products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils'; // সিকিউরিটির জন্য

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'menuItems';

export async function POST(request: NextRequest) {
  try {
    // সিকিউরিটি চেক (যাতে অন্য কেউ ফেক ডেটা না ঢোকাতে পারে)
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { products } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: false, error: 'Please provide an array of products' }, { status: 400 });
    }

    // আপনার ডেটাবেসের স্ট্রাকচার অনুযায়ী ডেটা ম্যাপ করা
    const formattedProducts = products.map((item: any) => ({
      Name: item.name,
      Description: item.description || "",
      Price: parseFloat(item.price),
      Category: item.category,
      ImageURLs: Array.isArray(item.imageUrls) ? item.imageUrls : (item.imageUrls ? [item.imageUrls] : []),
      Bestseller: item.featured || false,
      InStock: item.inStock !== undefined ? item.inStock : true,
      CreatedAt: new Date()
    }));

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // insertMany দিয়ে একসাথে সব ডেটা ইনসার্ট করা
    const result = await db.collection(COLLECTION_NAME).insertMany(formattedProducts);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully added ${result.insertedCount} dishes! 🚀`,
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}