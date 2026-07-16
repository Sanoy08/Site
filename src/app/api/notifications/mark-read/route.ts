import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUser } from '@/lib/auth-utils';

const DB_NAME = 'BumbasKitchenDB';
const NOTIFICATIONS_COLLECTION = 'notifications';

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser._id || currentUser.id;
    const body = await request.json().catch(() => ({}));
    const { notificationId } = body;

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const notificationsCollection = db.collection(NOTIFICATIONS_COLLECTION);

    const query: any = {
      $or: [{ userId: userId }, { userId: new ObjectId(userId) }]
    };

    if (notificationId) {
      query._id = new ObjectId(notificationId);
    } else {
      // Mark all unread as read
      query.isRead = { $ne: true };
    }

    await notificationsCollection.updateMany(query, { $set: { isRead: true } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Mark Read Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
