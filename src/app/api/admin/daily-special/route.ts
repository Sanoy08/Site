// src/app/api/admin/daily-special/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher';
import { sendNotificationToAllUsers } from '@/lib/notification';
import { verifyAdmin } from '@/lib/auth-utils'; // ★★★ কুকি চেকার ইম্পোর্ট

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'menuItems';

export async function GET(request: NextRequest) {
  try {
    // ১. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক (Optional, but good practice for admin routes)
    if (!await verifyAdmin(request)) {
       return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const specialItem = await db.collection(COLLECTION_NAME).findOne({ isDailySpecial: true });

    if (!specialItem) {
        return NextResponse.json({ success: false, message: "No daily special set yet." });
    }

    return NextResponse.json({ 
        success: true, 
        data: {
            id: specialItem._id,
            name: specialItem.Name,
            price: specialItem.Price,
            description: specialItem.Description,
            imageUrl: specialItem.ImageURLs?.[0] || '',
            inStock: specialItem.InStock
        }
    });

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
    const { name, price, items, imageUrl, inStock, notifyUsers } = body;

    const description = items.map((item: string) => `• ${item}`).join('\n');

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const productData = {
        Name: name,
        Price: parseFloat(price),
        Description: description,
        Category: "Thali",
        ImageURLs: [imageUrl],
        InStock: inStock,
        isDailySpecial: true,
        Bestseller: false,
        UpdatedAt: new Date()
    };

    const existing = await collection.findOne({ isDailySpecial: true });

    if (existing) {
        await collection.updateOne({ _id: existing._id }, { $set: productData });
    } else {
        await collection.insertOne({ ...productData, CreatedAt: new Date() });
    }

    revalidatePath('/menus');
    revalidatePath('/');

    // Frontend Realtime Trigger
    await pusherServer.trigger('menu-updates', 'product-changed', {
        message: "Daily Special Menu Updated! 🍛",
        type: 'update'
    });

    // Notification Logic
    if (notifyUsers) {
        await sendNotificationToAllUsers(
            client,
            "Today's Special! 🍛",
            `New ${name} is now available. Order before it runs out!`,
            imageUrl || "", 
            '/menus/special-veg-thalii' // Link
        ).catch(console.error);
    }

    return NextResponse.json({ success: true, message: 'Daily menu updated successfully' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}