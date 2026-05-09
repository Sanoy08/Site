// src/app/api/admin/daily-special/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher';
import { sendNotificationToAllUsers } from '@/lib/notification';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb'; // ★ ObjectId ইম্পোর্ট করা হলো আইডি চেক করার জন্য

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'menuItems';

export async function GET(request: NextRequest) {
  try {
    if (!await verifyAdmin(request)) {
       return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // ★ findOne এর বদলে find().toArray() ব্যবহার করা হলো যাতে সব ডেইলি স্পেশাল লিস্ট পাওয়া যায়
    const specialItems = await db.collection(COLLECTION_NAME).find({ isDailySpecial: true }).toArray();

    if (!specialItems || specialItems.length === 0) {
        return NextResponse.json({ success: false, data: [], message: "No daily special set yet." });
    }

    // ফ্রন্টএন্ডের জন্য ডাটা ম্যাপ করে পাঠানো হচ্ছে
    const formattedData = specialItems.map(item => ({
        _id: item._id.toString(), // ফ্রন্টএন্ড id হিসেবে এটি ব্যবহার করবে
        name: item.Name,
        price: item.Price,
        description: item.Description,
        ImageURLs: item.ImageURLs || [],
        imageUrl: item.ImageURLs?.[1] || item.ImageURLs?.[0] || '',
        inStock: item.InStock
    }));

    return NextResponse.json({ success: true, data: formattedData });

  } catch (error: any) {
    console.error("GET Daily Special Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // ★ ফ্রন্টএন্ড থেকে আসা `id` রিসিভ করা হলো
    const { id, name, price, items, ImageURLs, imageUrl, inStock, notifyUsers } = body;

    // ★ যদি id না আসে বা ভুল ফরম্যাটের হয়
    if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Invalid or missing Menu ID' }, { status: 400 });
    }

    const description = items.map((item: string) => `• ${item}`).join('\n');

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const productData = {
        Name: name,
        Price: parseFloat(price),
        Description: description,
        ImageURLs: ImageURLs || (imageUrl ? [imageUrl] : []),
        InStock: inStock,
        UpdatedAt: new Date()
    };

    // ★ নির্দিষ্ট ID ধরে আপডেট করা হচ্ছে
    const updateResult = await collection.updateOne(
        { _id: new ObjectId(id) }, 
        { $set: productData }
    );

    if (updateResult.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Menu item not found in database' }, { status: 404 });
    }

    revalidatePath('/menus');
    revalidatePath('/');

    // Frontend Realtime Trigger
    await pusherServer.trigger('menu-updates', 'product-changed', {
        message: `${name} Updated! 🍛`, // ডাইনামিক নাম দেওয়া হলো
        type: 'update'
    });

    // Notification Logic
    if (notifyUsers) {
        // মেনুর নাম থেকে ডাইনামিক লিংক তৈরি করার চেষ্টা (যেমন: special-veg-thali)
        const slug = name.toLowerCase().replace(/ /g, '-');
        
        await sendNotificationToAllUsers(
            client,
            "Today's Special Updated! 🍛",
            `${name} is ready! Order before it runs out.`,
            imageUrl || (ImageURLs && ImageURLs[1]) || "", 
            `/menus/${slug}` // ডাইনামিক লিংক
        ).catch(console.error);
    }

    return NextResponse.json({ success: true, message: 'Daily menu updated successfully' });

  } catch (error: any) {
    console.error("POST Daily Special Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update menu" }, { status: 500 });
  }
}
