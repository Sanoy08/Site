// src/app/api/admin/hero-slides/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import { revalidatePath } from 'next/cache';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'heroSlides';
const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

async function isAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  try {
    const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    return decoded.role === 'admin';
  } catch { return false; }
}

function extractPublicId(imageUrl: string) {
    try {
        const regex = /\/v\d+\/(.+)\.\w+$/;
        const match = imageUrl.match(regex);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
}

// ★★★ ফিক্স: params এখন একটি Promise, তাই টাইপ এবং await ব্যবহার করা হয়েছে ★★★
export async function DELETE(
    request: NextRequest, 
    props: { params: Promise<{ id: string }> }
) {
  try {
    // ১. পারমিশন চেক
    if (!await isAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ২. params await করা (Next.js 15 Fix)
    const params = await props.params;
    const { id } = params;

    // ৩. আইডি ভ্যালিড কি না চেক করা
    if (!ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // ৪. ডিলিট করার আগে ডেটা খুঁজে বের করা (ইমেজ ডিলিট করার জন্য)
    const slideToDelete = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!slideToDelete) {
        return NextResponse.json({ success: false, error: 'Slide not found' }, { status: 404 });
    }

    // ৫. Cloudinary থেকে ইমেজ ডিলিট করা
    if (slideToDelete.imageUrl) {
        const publicId = extractPublicId(slideToDelete.imageUrl);
        if (publicId) {
            try {
                await cloudinary.uploader.destroy(publicId);
            } catch (cloudError) {
                console.error("Cloudinary delete error:", cloudError);
            }
        }
    }

    // ৬. ডাটাবেস থেকে ডিলিট করা
    await collection.deleteOne({ _id: new ObjectId(id) });

    // ৭. ক্যাশ রিভ্যালিডেট
    revalidatePath('/');

    return NextResponse.json({ success: true, message: 'Slide deleted successfully' });

  } catch (error: any) {
    console.error("Delete Slide Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}