// src/lib/notification.ts
import { MongoClient, ObjectId } from 'mongodb';
import { messaging } from './firebase-admin';

const DB_NAME = 'BumbasKitchenDB';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

// ★ ফিক্স: অফলাইন ডেলিভারির জন্য কনফিগ
const ANDROID_CONFIG = {
  priority: 'high' as const, // ব্যাটারি সেভার মোডেও নোটিফিকেশন ঢুকবে
  ttl: 86400 * 1000, // ১ দিন (24 ঘণ্টা) পর্যন্ত মেসেজ সার্ভারে জমা থাকবে
  notification: {
    icon: 'ic_stat_icon',
    color: '#f97316',
    channelId: 'default', // চ্যানেল আইডি নিশ্চিত করা হলো
    defaultSound: true,
    defaultVibrateTimings: true
  }
};

// ১. নির্দিষ্ট ইউজারকে পাঠানো
export async function sendNotificationToUser(client: MongoClient, userId: string, title: string, body: string, url: string = '/') {
  try {
    const db = client.db(DB_NAME);
    
    // ডাটাবেসে সেভ করা (হিস্ট্রির জন্য)
    await db.collection(NOTIFICATIONS_COLLECTION).insertOne({
        userId: new ObjectId(userId),
        title,
        message: body,
        link: url,
        isRead: false,
        createdAt: new Date()
    });

    // টোকেন খুঁজে বের করা
    const tokensDocs = await db.collection(SUBSCRIPTIONS_COLLECTION).find({ 
        userId: new ObjectId(userId) 
    }).toArray();

    const tokens = tokensDocs.map(doc => doc.token);
    if (tokens.length === 0) return;

    // ★ ফিক্স: হাই প্রায়োরিটি কনফিগ যোগ করা হয়েছে
    await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { url },
      android: ANDROID_CONFIG // এখানে আমাদের নতুন কনফিগ ব্যবহার করছি
    });

    console.log(`Notification sent to user ${userId}: ${title}`);

  } catch (error) {
    console.error("Error sending user notification:", error);
  }
}

// ২. সবাইকে পাঠানো (ব্রডকাস্ট)
export async function sendNotificationToAllUsers(client: MongoClient, title: string, body: string, url: string = '/') {
    try {
        const db = client.db(DB_NAME);
        
        // হিস্ট্রিতে সেভ করা
        const users = await db.collection(USERS_COLLECTION).find({}, { projection: { _id: 1 } }).toArray();
        if (users.length > 0) {
             const notificationsToSave = users.map(u => ({
                userId: u._id,
                title,
                message: body,
                link: url,
                isRead: false,
                createdAt: new Date()
            }));
            await db.collection(NOTIFICATIONS_COLLECTION).insertMany(notificationsToSave);
        }

        // ★ ফিক্স: টপিক মেসেজেও হাই প্রায়োরিটি
        await messaging.send({
            topic: 'all_users',
            notification: { title, body },
            data: { url },
            android: ANDROID_CONFIG
        });

        console.log(`Broadcast notification sent: ${title}`);

    } catch (error) {
        console.error("Error broadcasting notification:", error);
    }
}

// ৩. অ্যাডমিনদের পাঠানো
export async function sendNotificationToAdmins(client: MongoClient, title: string, body: string, url: string = '/admin/orders') {
  try {
    const db = client.db(DB_NAME);
    const admins = await db.collection(USERS_COLLECTION).find({ role: 'admin' }).toArray();
    const adminIds = admins.map(admin => admin._id);

    if (adminIds.length === 0) return;

    // হিস্ট্রিতে সেভ
    const notificationsToSave = adminIds.map(id => ({
        userId: id,
        title,
        message: body,
        link: url,
        isRead: false,
        createdAt: new Date()
    }));
    await db.collection(NOTIFICATIONS_COLLECTION).insertMany(notificationsToSave);

    // টোকেন আনা
    const tokenDocs = await db.collection(SUBSCRIPTIONS_COLLECTION).find({ 
        userId: { $in: adminIds } 
    }).toArray();
    const tokens = tokenDocs.map(t => t.token);

    if (tokens.length > 0) {
        // ★ ফিক্স: অ্যাডমিনদের জন্যও হাই প্রায়োরিটি
        await messaging.sendEachForMulticast({
            tokens,
            notification: { title, body },
            data: { url },
            android: ANDROID_CONFIG
        });
    }
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
}