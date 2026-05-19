// src/app/api/admin/offers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/auth-utils';
import { bumpHomeVersion } from '@/lib/version'; // ★ ইম্পোর্ট করা হলো

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'offers';

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

    const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });
    }

    // ★ ভার্সন আপডেট 
    await bumpHomeVersion();

    revalidatePath('/');

    return NextResponse.json({ success: true, message: 'Offer deleted successfully' });

  } catch (error: any) {
    console.error("Delete Offer Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}