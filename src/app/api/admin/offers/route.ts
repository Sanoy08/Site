// src/app/api/admin/offers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { v2 as cloudinary } from 'cloudinary';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/auth-utils'; // ★★★ কুকি চেকার ইম্পোর্ট
import { bumpHomeVersion } from '@/lib/version';

function extractPublicId(imageUrl: string) {
  try {
    const matchWithVersion = imageUrl.match(/\/v\d+\/(.+)\.\w+$/);
    if (matchWithVersion && matchWithVersion[1]) return matchWithVersion[1];
    const matchWithoutVersion = imageUrl.match(/\/upload\/(?:[^\/]+\/)?(.+)\.\w+$/);
    if (matchWithoutVersion && matchWithoutVersion[1]) return matchWithoutVersion[1];
    return null;
  } catch (e) {
    return null;
  }
}

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'offers';

export async function GET(request: NextRequest) {
  try {
    // ১. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const offers = await db.collection(COLLECTION_NAME).find({}).toArray();

    const formattedOffers = offers.map(offer => ({
      id: offer._id.toString(),
      title: offer.title,
      description: offer.description,
      price: offer.price,
      imageUrl: offer.imageUrl,
      active: offer.active,
      isSpecialOffer: offer.isSpecialOffer || false,
      deliveryDate: offer.deliveryDate || '',
      orderCutoffTime: offer.orderCutoffTime || '',
      mealType: offer.mealType || 'both',
      createdAt: offer.createdAt
    }));

    return NextResponse.json({ success: true, offers: formattedOffers }, { status: 200 });
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
    
    const newOffer = {
      title: body.title,
      description: body.description,
      price: parseFloat(body.price),
      imageUrl: body.imageUrl,
      active: body.active ?? true,
      isSpecialOffer: body.isSpecialOffer || false,
      deliveryDate: body.deliveryDate || '',
      orderCutoffTime: body.orderCutoffTime || '',
      mealType: body.mealType || 'both',
      createdAt: new Date()
    };

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const result = await db.collection(COLLECTION_NAME).insertOne(newOffer);

    if (result.acknowledged) {
      // ★ ক্যাশ ক্লিয়ার
      revalidatePath('/');
      await bumpHomeVersion();

      return NextResponse.json({ success: true, message: 'Offer created', offerId: result.insertedId }, { status: 201 });
    } else {
      throw new Error('Failed to create offer');
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Offer ID is required' }, { status: 400 });
    }
    
    // Convert string ID to ObjectId for MongoDB
    const { ObjectId } = require('mongodb');
    
    if (updateData.price) {
      updateData.price = parseFloat(updateData.price);
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const existingOffer = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingOffer) {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });
    }

    // 1. Update document in MongoDB first
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount > 0) {
      // 2. AFTER update succeeds, delete replaced image from Cloudinary
      if (updateData.imageUrl && existingOffer.imageUrl && existingOffer.imageUrl !== updateData.imageUrl) {
        const oldPublicId = extractPublicId(existingOffer.imageUrl);
        if (oldPublicId) {
          try {
            if (existingOffer.imageUrl.includes(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_DISHES || 'dk1acdtja')) {
              cloudinary.config({
                cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_DISHES,
                api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY_DISHES,
                api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET_DISHES,
              });
            } else {
              cloudinary.config({
                cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
                api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
              });
            }
            await cloudinary.uploader.destroy(oldPublicId);
          } catch (e) {
            console.error("Failed to delete replaced offer image from Cloudinary:", e);
          }
        }
      }

      revalidatePath('/');
      await bumpHomeVersion();
      return NextResponse.json({ success: true, message: 'Offer updated successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}