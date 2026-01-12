// src/app/api/admin/slider-images/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import { revalidatePath } from 'next/cache';

// Cloudinary কনফিগারেশন
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'homeSliderImages'; // নতুন কালেকশন
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// অ্যাডমিন চেক ফাংশন
async function isAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  try {
    const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    return decoded.role === 'admin';
  } catch { return false; }
}

// ইমেজ ইউআরএল থেকে Public ID বের করার ফাংশন
function extractPublicId(imageUrl: string) {
    try {
        const regex = /\/v\d+\/(.+)\.\w+$/;
        const match = imageUrl.match(regex);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
}

// ★★★ ফিক্স: params এখন Promise হিসেবে রিসিভ করা হচ্ছে (Next.js 15) ★★★
export async function DELETE(
    request: NextRequest, 
    props: { params: Promise<{ id: string }> }
) {
  try {
    // ১. পারমিশন চেক
    if (!await isAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ২. params await করা (গুরুত্বপূর্ণ ফিক্স)
    const params = await props.params;
    const { id } = params;

    // ৩. আইডি ভ্যালিড কি না চেক
    if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // ৪. ডিলিট করার আগে ডেটা খুঁজে বের করা (ইমেজ ডিলিট করার জন্য)
    const slideToDelete = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!slideToDelete) {
        return NextResponse.json({ success: false, error: 'Image not found' }, { status: 404 });
    }

    // ৫. Cloudinary থেকে ইমেজ ডিলিট করা
    if (slideToDelete.imageUrl) {
        const publicId = extractPublicId(slideToDelete.imageUrl);
        if (publicId) {
            try {
                await cloudinary.uploader.destroy(publicId);
                console.log("Cloudinary image deleted:", publicId);
            } catch (cloudError) {
                console.error("Cloudinary delete error:", cloudError);
            }
        }
    }

    // ৬. ডাটাবেস থেকে ডিলিট করা
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
        // ৭. ক্যাশ রিভ্যালিডেট
        revalidatePath('/');
        return NextResponse.json({ success: true, message: 'Image deleted successfully' });
    } else {
        return NextResponse.json({ success: false, error: 'Failed to delete from DB' }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Delete Slider Image Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}