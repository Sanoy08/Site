// src/lib/notification.ts
import { MongoClient, ObjectId } from 'mongodb';
import { messaging } from './firebase-admin';

const DB_NAME = 'BumbasKitchenDB';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

// ১. নির্দিষ্ট ইউজারকে পাঠানো
// ★ আপডেট: imageUrl প্যারামিটার যোগ করা হয়েছে
export async function sendNotificationToUser(
    client: MongoClient, 
    userId: string, 
    title: string, 
    body: string, 
    imageUrl: string = '', // নতুন প্যারামিটার (ফাঁকা হতে পারে)
    url: string = '/'
) {
  try {
    const db = client.db(DB_NAME);
    
    // ডাটাবেসে সেভ করা (হিস্ট্রির জন্য)
    await db.collection(NOTIFICATIONS_COLLECTION).insertOne({
        userId: new ObjectId(userId),
        title,
        message: body,
        image: imageUrl, // ★ ইমেজ লিংক সেভ করা হলো
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

    // ★ ইমেজ সহ পাঠানো
    await messaging.sendEachForMulticast({
      tokens,
      notification: { 
          title, 
          body,
          ...(imageUrl && { imageUrl: imageUrl }) // iOS/Web এর জন্য
      },
      data: { url },
      android: {
        priority: 'high',
        ttl: 86400 * 1000,
        notification: {
          icon: 'ic_stat_icon',
          color: '#f97316',
          channelId: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
          ...(imageUrl && { imageUrl: imageUrl }) // ★ অ্যান্ড্রয়েডে ছবি দেখানোর জন্য এটা মাস্ট
        }
      }
    });

    console.log(`Notification sent to user ${userId}: ${title}`);

  } catch (error) {
    console.error("Error sending user notification:", error);
  }
}

// ২. সবাইকে পাঠানো (ব্রডকাস্ট)
// ★ আপডেট: imageUrl প্যারামিটার যোগ করা হয়েছে
export async function sendNotificationToAllUsers(
    client: MongoClient, 
    title: string, 
    body: string, 
    imageUrl: string = '', // নতুন প্যারামিটার
    url: string = '/'
) {
    try {
        const db = client.db(DB_NAME);
        
        // হিস্ট্রিতে সেভ করা
        const users = await db.collection(USERS_COLLECTION).find({}, { projection: { _id: 1 } }).toArray();
        if (users.length > 0) {
             const notificationsToSave = users.map(u => ({
                userId: u._id,
                title,
                message: body,
                image: imageUrl, // ★ ইমেজ লিংক সেভ করা হলো
                link: url,
                isRead: false,
                createdAt: new Date()
            }));
            await db.collection(NOTIFICATIONS_COLLECTION).insertMany(notificationsToSave);
        }

        // ★ ইমেজ সহ ব্রডকাস্ট পাঠানো
        await messaging.send({
            topic: 'all_users',
            notification: { 
                title, 
                body,
                ...(imageUrl && { imageUrl: imageUrl }) 
            },
            data: { url },
            android: {
                priority: 'high',
                ttl: 86400 * 1000,
                notification: {
                    icon: 'ic_stat_icon',
                    color: '#f97316',
                    channelId: 'default',
                    defaultSound: true,
                    defaultVibrateTimings: true,
                    ...(imageUrl && { imageUrl: imageUrl }) // ★ অ্যান্ড্রয়েডে ছবি দেখানোর জন্য
                }
            }
        });

        console.log(`Broadcast notification sent: ${title}`);

    } catch (error) {
        console.error("Error broadcasting notification:", error);
    }
}

// ৩. অ্যাডমিনদের পাঠানো (এখানে সাধারণত ইমেজ লাগে না, তাই আগের মতোই রাখা হলো)
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
        await messaging.sendEachForMulticast({
            tokens,
            notification: { title, body },
            data: { url },
            android: {
                priority: 'high',
                notification: {
                    icon: 'ic_stat_icon',
                    color: '#f97316',
                    channelId: 'default'
                }
            }
        });
    }
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
}