// src/app/api/admin/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher';
import { sendNotificationToAllUsers } from '@/lib/notification';
import { verifyAdmin } from '@/lib/auth-utils'; // ★★★ কুকি চেকার ইম্পোর্ট

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'menuItems';

export async function PUT(
    request: NextRequest, 
    props: { params: Promise<{ id: string }> }
) {
  try {
    // ১. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ২. params await করা (Next.js 15 Fix)
    const params = await props.params;
    const { id } = params;
    const body = await request.json();
    
    // ইমেজ অ্যারে ঠিক করা
    const finalImages = Array.isArray(body.imageUrls) ? body.imageUrls : (body.imageUrls ? [body.imageUrls] : []);

    const updateData = {
      Name: body.name,
      Description: body.description,
      Price: parseFloat(body.price),
      Category: body.category,
      ImageURLs: finalImages,
      Bestseller: body.featured,
      InStock: body.inStock
    };

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    await db.collection(COLLECTION_NAME).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // ৩. ক্যাশ রিফ্রেশ
    revalidatePath('/menus');
    revalidatePath('/');

    // ৪. রিয়েল-টাইম আপডেট (লাইভ ইউজারদের জন্য)
    await pusherServer.trigger('menu-updates', 'product-changed', {
        message: 'Menu updated',
        type: 'update'
    });

    // ★ ৫. "Juicy" পুশ নোটিফিকেশন পাঠানো (সবার কাছে) ★
    try {
        const notificationImage = finalImages.length > 0 ? finalImages[0] : "";
        
        await sendNotificationToAllUsers(
            client,
            "✨ Taste Update! 👨‍🍳", // Juicy Title
            `${body.name} just got refreshed! Check out the new details in our menu. 🍛`, // Juicy Body
            notificationImage,
            '/menus' // ক্লিক করলে মেনু পেজে যাবে
        );
    } catch (notifError) {
        console.error("Failed to send update notification:", notifError);
    }

    return NextResponse.json({ success: true, message: 'Product updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
    request: NextRequest, 
    props: { params: Promise<{ id: string }> }
) {
  try {
    // ১. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ২. params await করা
    const params = await props.params;
    const { id } = params;

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });

    revalidatePath('/menus');
    revalidatePath('/');

    // রিয়েল-টাইম ডিলিট নোটিফিকেশন
    await pusherServer.trigger('menu-updates', 'product-changed', {
        message: 'Product removed from menu',
        type: 'delete'
    });

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}