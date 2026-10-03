import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'users';

export async function PATCH(request: NextRequest) {
  // লগ-ইন করা ইউজারের ডেটা বের করা
  const user = await getUser(request);
  const userId = user ? (user._id || user.id) : null;
  
  if (!userId) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { lat, lng } = body;

    if (!lat || !lng) {
        return NextResponse.json({ error: 'Coordinates required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // ইউজারের মেইন কালেকশনেই loginAddress নামে সেভ করে দেওয়া
    await db.collection(COLLECTION_NAME).updateOne(
        { _id: new ObjectId(userId) },
        { $set: { "loginAddress": { lat: parseFloat(lat), lng: parseFloat(lng) } } }
    );

    return NextResponse.json({ success: true, message: 'Login address saved successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
