// src/app/api/admin/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher'; 
import { sendNotificationToAllUsers } from '@/lib/notification'; 
import { verifyAdmin } from '@/lib/auth-utils'; // ★★★ কুকি চেকার ইম্পোর্ট
import { bumpHomeVersion } from '@/lib/version';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'menuItems';

export async function GET(request: NextRequest) {
  try {
    // ১. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const products = await db.collection(COLLECTION_NAME).find({}).toArray();

    const formattedProducts = products.map(item => ({
      id: item._id.toString(),
      name: item.Name,
      description: item.Description,
      price: item.Price,
      category: { name: item.Category, id: item.Category?.toLowerCase() },
      // ইমেজ অ্যারে হ্যান্ডেলিং
      images: item.ImageURLs?.map((url: string, i: number) => ({ id: `img-${i}`, url, alt: item.Name })) || [],
      stock: item.InStock ? 100 : 0,
      featured: item.Bestseller === "true" || item.Bestseller === true,
    }));

    return NextResponse.json({ success: true, products: formattedProducts }, { status: 200 });
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
    const { name, description, price, category, imageUrls, featured, inStock } = body;

    const imgArray = Array.isArray(imageUrls) ? imageUrls : (imageUrls ? [imageUrls] : []);

    // নতুন প্রোডাক্ট অবজেক্ট
    const newProduct = {
      Name: name,
      Description: description,
      Price: parseFloat(price),
      Category: category,
      ImageURLs: imgArray,
      Bestseller: featured,
      InStock: inStock,
      CreatedAt: new Date()
    };

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const result = await db.collection(COLLECTION_NAME).insertOne(newProduct);

    if (result.acknowledged) {
      
      // ১. সার্ভার সাইড ক্যাশ রিফ্রেশ
      revalidatePath('/menus');
      revalidatePath('/');
      await bumpHomeVersion();

      // ২. ক্লায়েন্ট সাইড রিয়েল-টাইম আপডেট (Pusher)
      await pusherServer.trigger('menu-updates', 'product-changed', {
        message: `New dish "${name}" added to the menu!`,
        type: 'add'
      });

      // ৩. পুশ নোটিফিকেশন ব্রডকাস্ট
      try {
          const mainImage = imgArray.length > 0 ? imgArray[0] : "";
          
          await sendNotificationToAllUsers(
              client,
              "New Arrival! 🍲",
              `Check out our new dish: ${name}. Order now to taste the freshness!`,
              mainImage, // ★ ইমেজ পাস করা হয়েছে
              `/menus`
          );
      } catch (notifError) {
          console.error("Failed to broadcast new product notification:", notifError);
      }
      
      return NextResponse.json({ success: true, message: 'Product added successfully', productId: result.insertedId }, { status: 201 });
    } else {
      throw new Error('Failed to insert product');
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}