// src/app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { getUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
import { messaging } from '@/lib/firebase-admin'; // ★ Firebase Admin ইমপোর্ট করা হলো

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'subscriptions';

export async function POST(request: NextRequest) {
  try {
    const { token, appId } = await request.json(); 
    
    if (!token) return NextResponse.json({ success: false, error: "Token missing" });

    const user = await getUser(request);
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const updateData: any = { 
        token: token,
        updatedAt: new Date(),
        platform: 'android',
        appId: appId || 'com.bumbaskitchen.app' 
    };

    if (user) {
        updateData.userId = new ObjectId(user._id || user.id);
    }

    // ১. ডাটাবেসে টোকেন সেভ/আপডেট করা
    await db.collection(COLLECTION_NAME).updateOne(
      { token: token },
      { $set: updateData },
      { upsert: true }
    );

    // ★ ২. TOPIC SUBSCRIPTION LOGIC (ব্যাকএন্ড থেকে ফায়ারবেসকে নির্দেশ দেওয়া)
    try {
      if (appId === 'com.bumbaskitchen.admin') {
        // যদি অ্যাডমিন অ্যাপ হয়, তবে admin_updates টপিকে অ্যাড করে all_users থেকে রিমুভ করবে
        await messaging.subscribeToTopic([token], 'admin_updates');
        await messaging.unsubscribeFromTopic([token], 'all_users');
      } else {
        // কাস্টমার অ্যাপ হলে all_users টপিকে অ্যাড করবে
        await messaging.subscribeToTopic([token], 'all_users');
        await messaging.unsubscribeFromTopic([token], 'admin_updates');
      }
      console.log(`Successfully subscribed token to topic for ${appId}`);
    } catch (topicError) {
      console.error("Topic subscription failed:", topicError);
      // টপিক ফেইল করলেও আমরা এরর থ্রো করবো না, যাতে ডাটাবেস সেভ প্রসেস ব্রেক না করে
    }

    return NextResponse.json({ success: true, message: "Subscription updated and added to Topic" });
  } catch (error: any) {
    console.error("Sub Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
