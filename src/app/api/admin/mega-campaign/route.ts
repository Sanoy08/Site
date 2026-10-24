import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { bumpHomeVersion } from '@/lib/version';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION = 'megacampaign';

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

function collectImageUrls(doc: any): string[] {
  if (!doc) return [];
  const urls: string[] = [];
  if (doc.homeBannerImage) urls.push(doc.homeBannerImage);
  if (doc.pageBgImage) urls.push(doc.pageBgImage);
  if (doc.headingImage) urls.push(doc.headingImage);
  if (Array.isArray(doc.categories)) {
    for (const cat of doc.categories) {
      if (cat?.image) urls.push(cat.image);
      if (Array.isArray(cat?.items)) {
        for (const it of cat.items) {
          if (it?.image) urls.push(it.image);
        }
      }
    }
  }
  return urls;
}

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // There should only be one active mega campaign settings document
    const campaign = await db.collection(COLLECTION).findOne({ _id: 'main' });
    
    return NextResponse.json({
      success: true,
      campaign: campaign || {
        _id: 'main',
        isActive: false,
        homeBannerImage: '',
        pageBgImage: '',
        headingImage: '',
        categories: []
      }
    });
  } catch (error) {
    console.error('MegaCampaign fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch campaign' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Fetch existing document to find images that will be orphaned
    const existingDoc = await db.collection(COLLECTION).findOne({ _id: 'main' });

    const updateDoc = {
      $set: {
        isActive: body.isActive ?? false,
        homeBannerImage: body.homeBannerImage || '',
        pageBgImage: body.pageBgImage || '',
        headingImage: body.headingImage || '',
        categories: body.categories || [],
        updatedAt: new Date()
      }
    };

    await db.collection(COLLECTION).updateOne(
      { _id: 'main' },
      updateDoc,
      { upsert: true }
    );

    // After successful update, clean up replaced or deleted Cloudinary images
    if (existingDoc) {
      const oldImages = collectImageUrls(existingDoc);
      const newImages = new Set(collectImageUrls(updateDoc.$set));
      const removedImages = oldImages.filter((img) => img && !newImages.has(img));

      for (const imgUrl of removedImages) {
        const publicId = extractPublicId(imgUrl);
        if (publicId) {
          try {
            if (imgUrl.includes(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_DISHES || 'dk1acdtja')) {
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
            console.error('MegaCampaign Cloudinary image cleanup error:', cloudError);
          }
        }
      }
    }

    await bumpHomeVersion();
    revalidatePath('/');
    revalidatePath('/mega-campaign');

    return NextResponse.json({ success: true, message: 'Mega campaign updated successfully' });
  } catch (error) {
    console.error('MegaCampaign update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update campaign' }, { status: 500 });
  }
}

