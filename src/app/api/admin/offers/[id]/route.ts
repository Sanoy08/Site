// src/app/api/admin/offers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { revalidatePath } from 'next/cache';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'offers';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

async function isAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  try {
    const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    return decoded.role === 'admin';
  } catch { return false; }
}

// ★★★ ফিক্স: params এখন একটি Promise, তাই টাইপ এবং await ব্যবহার করা হয়েছে ★★★
export async function DELETE(
    request: NextRequest, 
    props: { params: Promise<{ id: string }> }
) {
  try {
    // ১. পারমিশন চেক
    if (!await isAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ২. params await করা (Next.js 15 Fix)
    const params = await props.params;
    const { id } = params;

    // ৩. আইডি ভ্যালিড কি না চেক করা
    if (!ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // ৪. ডিলিট করা
    const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
        return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });
    }

    // ৫. ক্যাশ ক্লিয়ার (যাতে হোমপেজে অফার লিস্ট আপডেট হয়)
    revalidatePath('/');

    return NextResponse.json({ success: true, message: 'Offer deleted successfully' });

  } catch (error: any) {
    console.error("Delete Offer Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}