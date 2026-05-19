// src/app/api/admin/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher';
import { sendNotificationToAllUsers } from '@/lib/notification';
import { verifyAdmin } from '@/lib/auth-utils'; 
import { bumpHomeVersion } from '@/lib/version'; // ★ ইম্পোর্ট করা হলো

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'menuItems';

export async function PUT(
    request: NextRequest, 
    props: { params: Promise<{ id: string }> }
) {
  try {
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;
    const body = await request.json();
    
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

    // ★ ডেটা আপডেট হলো, তাই ভার্সন বাড়ানো হলো
    await bumpHomeVersion();

    revalidatePath('/menus');
    revalidatePath('/');

    await pusherServer.trigger('menu-updates', 'product-changed', {
        message: 'Menu updated',
        type: 'update'
    });

    try {
        const notificationImage = finalImages.length > 0 ? finalImages[0] : "";
        await sendNotificationToAllUsers(
            client,
            "✨ Taste Update! 👨‍🍳", 
            `${body.name} just got refreshed! Check out the new details in our menu. 🍛`, 
            notificationImage,
            '/menus' 
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
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });

    // ★ ডেটা ডিলিট হলো, তাই ভার্সন বাড়ানো হলো
    await bumpHomeVersion();

    revalidatePath('/menus');
    revalidatePath('/');

    await pusherServer.trigger('menu-updates', 'product-changed', {
        message: 'Product removed from menu',
        type: 'delete'
    });

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}