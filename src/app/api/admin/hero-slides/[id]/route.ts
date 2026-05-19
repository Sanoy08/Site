// src/app/api/admin/hero-slides/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/auth-utils'; 
import { bumpHomeVersion } from '@/lib/version'; // ★ ইম্পোর্ট করা হলো

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'heroSlides';

function extractPublicId(imageUrl: string) {
    try {
        const regex = /\/v\d+\/(.+)\.\w+$/;
        const match = imageUrl.match(regex);
        return match ? match[1] : null;
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

    const slideToDelete = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!slideToDelete) {
        return NextResponse.json({ success: false, error: 'Slide not found' }, { status: 404 });
    }

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

    await collection.deleteOne({ _id: new ObjectId(id) });

    // ★ ভার্সন আপডেট 
    await bumpHomeVersion();

    revalidatePath('/');

    return NextResponse.json({ success: true, message: 'Slide deleted successfully' });

  } catch (error: any) {
    console.error("Delete Slide Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}