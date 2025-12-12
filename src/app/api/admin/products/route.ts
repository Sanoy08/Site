// src/app/api/admin/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAuth } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher';
import { sendNotificationToAllUsers } from '@/lib/notification';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'menuItems';

async function isAdmin(request: NextRequest) {
  const decodedToken = await verifyAuth(request);
  if (!decodedToken) return false;

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const user = await db.collection('users').findOne({
      $or: [{ uid: decodedToken.uid }, { email: decodedToken.email }]
    });
    return user?.role === 'admin';
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const products = await db.collection(COLLECTION_NAME).find({}).toArray();

    const formattedProducts = products.map(item => ({
      id: item._id.toString(),
      name: item.Name,
      description: item.Description,
      price: item.Price,
      category: { name: item.Category, id: item.Category?.toLowerCase() },
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
    if (!await isAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, category, imageUrls, featured, inStock } = body;

    const newProduct = {
      Name: name,
      Description: description,
      Price: parseFloat(price),
      Category: category,
      ImageURLs: Array.isArray(imageUrls) ? imageUrls : (imageUrls ? [imageUrls] : []),
      Bestseller: featured,
      InStock: inStock,
      CreatedAt: new Date()
    };

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const result = await db.collection(COLLECTION_NAME).insertOne(newProduct);

    if (result.acknowledged) {
      
      // 1. Refresh Server Cache
      revalidatePath('/menus');
      revalidatePath('/');

      // 2. Realtime Update (Pusher)
      await pusherServer.trigger('menu-updates', 'product-changed', {
        message: `New dish "${name}" added to the menu!`,
        type: 'add'
      });

      // 3. Broadcast Notification
      try {
          await sendNotificationToAllUsers(
              client,
              "New Arrival! 🍲",
              `Check out our new dish: ${name}. Order now to taste the freshness!`,
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