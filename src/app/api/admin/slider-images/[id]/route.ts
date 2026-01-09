// src/app/api/admin/slider-images/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { revalidatePath } from 'next/cache';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'homeSliderImages';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

async function isAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  try {
    const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    return decoded.role === 'admin';
  } catch { return false; }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const result = await db.collection(COLLECTION_NAME).deleteOne({ 
      _id: new ObjectId(params.id) 
    });

    if (result.deletedCount === 1) {
      revalidatePath('/');
      return NextResponse.json({ success: true, message: 'Image deleted' }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: 'Image not found' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}