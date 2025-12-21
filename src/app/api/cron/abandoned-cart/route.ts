// src/app/api/cron/abandoned-cart/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { sendNotificationToUser } from '@/lib/notification';

// ব্রাউজার ক্যাশিং বন্ধ করার জন্য
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const queryKey = searchParams.get('key');

    const CRON_SECRET = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${CRON_SECRET}` && queryKey !== CRON_SECRET) {
        return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    const usersCollection = db.collection('users');

    // টেস্টিংয়ের জন্য ১ মিনিট (প্রোডাকশনে ১২ ঘণ্টা করে দেবেন)
    const timeCheck = new Date(Date.now() - 1 * 60 * 1000); 

    const abandonedUsers = await usersCollection.find({
        "cart.0": { $exists: true }, 
        cartUpdatedAt: { $lt: timeCheck }, 
        abandonedCartNotified: { $ne: true } 
    }).toArray();

    if (abandonedUsers.length === 0) {
        return NextResponse.json({ success: true, message: 'No abandoned carts found.' });
    }

    let notifiedCount = 0;

    for (const user of abandonedUsers) {
        // ★★★ ফিক্স: প্যারামিটার অর্ডার ঠিক করা হয়েছে ★★★
        await sendNotificationToUser(
            client,
            user._id.toString(),
            "You left something delicious! 😋",
            "Your cart is waiting. Complete your order before items run out!",
            "", // ★ 5th param: Image URL (ফাঁকা রাখা হলো, চাইলে ফুডের ছবি দিতে পারেন)
            "/cart" // ★ 6th param: Link (কার্ট পেজে যাবে)
        );

        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { abandonedCartNotified: true } }
        );
        notifiedCount++;
    }

    return NextResponse.json({ 
        success: true, 
        message: `Sent notifications to ${notifiedCount} users.` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}