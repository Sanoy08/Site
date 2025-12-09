// src/lib/notification.ts
import { MongoClient, ObjectId } from 'mongodb';
import { messaging } from './firebase-admin';

const DB_NAME = 'BumbasKitchenDB';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions'; // Now stores FCM Tokens
const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

// ১. নির্দিষ্ট ইউজারকে পাঠানো
export async function sendNotificationToUser(client: MongoClient, userId: string, title: string, body: string, url: string = '/') {
  try {
    const db = client.db(DB_NAME);
    
    // ডাটাবেসে সেভ করা
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

    // ★ ফিক্স: clickAction সরিয়ে দেওয়া হয়েছে
    await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { url }, // অ্যাপ এই URL ব্যবহার করে পেজ ওপেন করবে
      android: {
        notification: {
          icon: 'ic_stat_icon',
          color: '#f97316'
          // clickAction লাইনটি ডিলিট করা হয়েছে
        }
      }
    });

  } catch (error) {
    console.error("Error sending user notification:", error);
  }
}

// ২. সবাইকে পাঠানো (ব্রডকাস্ট)
export async function sendNotificationToAllUsers(client: MongoClient, title: string, body: string, url: string = '/') {
    try {
        const db = client.db(DB_NAME);
        
        // হিস্ট্রিতে সেভ করা (অপশনাল - ইউজার সংখ্যা বেশি হলে এটা অপ্টিমাইজ করতে হতে পারে)
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

        // ★ ফিক্স: clickAction সরিয়ে দেওয়া হয়েছে
        await messaging.send({
            topic: 'all_users',
            notification: { title, body },
            data: { url },
            android: {
                notification: {
                    // clickAction ডিলিট করা হয়েছে
                }
            }
        });

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
        // ★ ফিক্স: clickAction সরিয়ে দেওয়া হয়েছে
        await messaging.sendEachForMulticast({
            tokens,
            notification: { title, body },
            data: { url }
        });
    }
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
}