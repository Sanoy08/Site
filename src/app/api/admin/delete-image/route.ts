// src/app/api/admin/delete-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifyAdmin } from '@/lib/auth-utils';

function extractPublicId(imageUrl: string): string | null {
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

async function handleDeleteImage(request: NextRequest) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let imageUrl = '';
    let publicId = '';

    if (request.method === 'GET') {
      const url = new URL(request.url);
      imageUrl = url.searchParams.get('imageUrl') || '';
      publicId = url.searchParams.get('publicId') || '';
    } else {
      const body = await request.json().catch(() => ({}));
      imageUrl = body.imageUrl || '';
      publicId = body.publicId || '';
    }

    if (!publicId && imageUrl) {
      publicId = extractPublicId(imageUrl) || '';
    }

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: 'Valid imageUrl or publicId is required' },
        { status: 400 }
      );
    }

    // Determine Cloudinary account (Dishes vs General)
    const isDishesAccount =
      (imageUrl && imageUrl.includes(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_DISHES || 'dk1acdtja')) ||
      publicId.startsWith('dishes/');

    if (isDishesAccount) {
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

    const result = await cloudinary.uploader.destroy(publicId);

    return NextResponse.json({
      success: true,
      message: 'Image deleted from Cloudinary successfully',
      publicId,
      result,
    });
  } catch (error: any) {
    console.error('Delete Image API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleDeleteImage(request);
}

export async function DELETE(request: NextRequest) {
  return handleDeleteImage(request);
}
