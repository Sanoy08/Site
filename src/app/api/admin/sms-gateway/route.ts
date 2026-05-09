// src/app/api/admin/sms-gateway/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const DB_NAME = 'BumbasKitchenDB';
const SMS_COLLECTION = 'smsQueue';
const GATEWAY_SECRET = process.env.SMS_GATEWAY_SECRET!;

export async function GET(request: NextRequest) {
  try {
    // ১. সিকিউরিটি চেক (তোমার Automate অ্যাপ থেকে সিক্রেট কোড আসবে)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== GATEWAY_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // ২. পেন্ডিং SMS খোঁজা (সবচেয়ে পুরনোটা আগে)
    const pendingSms = await db.collection(SMS_COLLECTION)
      .findOne({ status: 'pending' }, { sort: { createdAt: 1 } });

    if (!pendingSms) {
      return NextResponse.json({ success: true, message: 'No SMS to send' }, { status: 200 });
    }

    // ৩. SMS প্রসেসিং শুরু (যাতে অন্য কেউ এটা না নেয়)
    await db.collection(SMS_COLLECTION).updateOne(
      { _id: pendingSms._id },
      { $set: { status: 'processing', updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      data: {
        id: pendingSms._id,
        phone: pendingSms.phone,
        message: pendingSms.message
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // SMS পাঠানো শেষ হলে Automate অ্যাপ এই API কল করবে
    const { id, secret } = await request.json();

    if (secret !== GATEWAY_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // SMS টি Queue থেকে ডিলিট করে দাও (বা sent মার্ক করো)
    await db.collection(SMS_COLLECTION).deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: 'SMS marked as sent' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}