// src/app/api/admin/offers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/auth-utils';
import { bumpHomeVersion } from '@/lib/version';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'offers';

function extractPublicId(imageUrl: string) {
    try {
        const matchWithVersion = imageUrl.match(/\/v\d+\/(.+)\.\w+$/);
        if (matchWithVersion && matchWithVersion[1]) {
            return matchWithVersion[1];
        }
        const matchWithoutVersion = imageUrl.match(/\/upload\/(?:[^\/]+\/)?(.+)\.\w+$/);
        if (matchWithoutVersion && matchWithoutVersion[1]) {
            return matchWithoutVersion[1];
        }
        return null;
    } catch (e) {
        return null;
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // 1. Find the offer to get its image URL before deleting
    const offerToDelete = await collection.findOne({ _id: new ObjectId(id) });

    if (!offerToDelete) {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });
    }

    // 2. Delete the image from Cloudinary if it exists
    if (offerToDelete.imageUrl) {
      const publicId = extractPublicId(offerToDelete.imageUrl);
      if (publicId) {
        try {
          if (offerToDelete.imageUrl.includes(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_DISHES || 'dk1acdtja')) {
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
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudError) {
          console.error("Cloudinary delete error:", cloudError);
        }
      }
    }

    // 3. Delete the offer document from MongoDB
    await collection.deleteOne({ _id: new ObjectId(id) });

    // 4. Update home version & revalidate cache
    await bumpHomeVersion();
    revalidatePath('/');

    return NextResponse.json({ success: true, message: 'Offer and banner deleted successfully' });

  } catch (error: any) {
    console.error("Delete Offer Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}