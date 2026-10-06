import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION = 'megacampaign';

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
        orderLastTime: '',
        deliveryDate: '',
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

    const updateDoc = {
      $set: {
        isActive: body.isActive ?? false,
        homeBannerImage: body.homeBannerImage || '',
        pageBgImage: body.pageBgImage || '',
        headingImage: body.headingImage || '',
        orderLastTime: body.orderLastTime || '',
        deliveryDate: body.deliveryDate || '',
        categories: body.categories || [],
        updatedAt: new Date()
      }
    };

    await db.collection(COLLECTION).updateOne(
      { _id: 'main' },
      updateDoc,
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: 'Mega campaign updated successfully' });
  } catch (error) {
    console.error('MegaCampaign update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update campaign' }, { status: 500 });
  }
}
