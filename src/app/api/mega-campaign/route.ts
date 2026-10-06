import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    const doc = await db.collection('megacampaign').findOne({ _id: 'main' });
    
    // Only return campaign if it exists AND is active
    if (!doc || !doc.isActive) {
      return NextResponse.json({ success: true, campaign: null });
    }

    return NextResponse.json({ success: true, campaign: doc });
  } catch (error) {
    console.error('Error fetching mega campaign:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
