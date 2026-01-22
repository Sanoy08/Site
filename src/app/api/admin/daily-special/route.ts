// src/app/api/admin/daily-special/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher';
import { sendNotificationToAllUsers } from '@/lib/notification';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'menuItems';
const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

async function isAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  try {
    const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    return decoded.role === 'admin';
  } catch { return false; }
}

export async function GET(request: NextRequest) {
  try {
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
    if (!await isAdmin(request)) {
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
            imageUrl || "", // ★ FIX: Image URL যোগ করা হয়েছে (খালি থাকলে ব্ল্যাঙ্ক স্ট্রিং)
            '/menus/special-veg-thalii' // Link
        ).catch(console.error);
    }

    return NextResponse.json({ success: true, message: 'Daily menu updated successfully' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}