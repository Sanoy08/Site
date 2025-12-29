// src/app/api/admin/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher';
// ★ ১. ইম্পোর্ট করা হলো
import { sendNotificationToAllUsers } from '@/lib/notification';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'menuItems';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

async function isAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  try {
    const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    return decoded.role === 'admin';
  } catch { return false; }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!await isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
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

    // ১. ক্যাশ রিফ্রেশ
    revalidatePath('/menus');
    revalidatePath('/');

    // ২. রিয়েল-টাইম আপডেট (লাইভ ইউজারদের জন্য)
    await pusherServer.trigger('menu-updates', 'product-changed', {
        message: 'Menu updated',
        type: 'update'
    });

    // ★ ৩. "Juicy" পুশ নোটিফিকেশন পাঠানো (সবার কাছে) ★
    // আমরা আলাদা try-catch রাখছি যাতে নোটিফিকেশন এরর হলে মেইন আপডেট ক্র্যাশ না করে
    try {
        // মেইন ইমেজটি নেওয়া হচ্ছে নোটিফিকেশনের জন্য
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!await isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });

    revalidatePath('/menus');
    revalidatePath('/');

    // রিয়েল-টাইম ডিলিট নোটিফিকেশন
    await pusherServer.trigger('menu-updates', 'product-changed', {
        message: 'Product removed from menu',
        type: 'delete'
    });

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}