// src/app/api/admin/bulk-insert/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils'; // সিকিউরিটি চেক

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'menuItems';

export async function POST(request: NextRequest) {
  try {
    // ১. সিকিউরিটি চেক (যাতে অ্যাডমিন ছাড়া অন্য কেউ ফেক ডেটা না ঢোকাতে পারে)
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid data format. Send an array of items.' }, { status: 400 });
    }

    // ২. MongoDB Export ডেটা ক্লিন করা (অপ্রয়োজনীয় $oid, $date রিমুভ করা)
    const formattedItems = items.map((item: any) => ({
      Name: item.Name,
      Description: item.Description,
      Price: Number(item.Price),
      Category: item.Category,
      ImageURLs: item.ImageURLs || [],
      Bestseller: item.Bestseller === true || item.Bestseller === "true",
      InStock: item.InStock ?? true,
      CreatedAt: new Date() // নতুন ফ্রেশ ডেট বসিয়ে দেওয়া হলো
    }));

    // ৩. ডেটাবেসে একসাথে সব ইনসার্ট করা
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const result = await db.collection(COLLECTION_NAME).insertMany(formattedItems);

    return NextResponse.json({ 
      success: true, 
      message: `${result.insertedCount} items successfully added to the menu!`,
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}