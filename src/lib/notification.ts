// src/lib/notification.ts
import { MongoClient, ObjectId } from 'mongodb';
import { messaging } from './firebase-admin';

const DB_NAME = 'BumbasKitchenDB';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

// ১. নির্দিষ্ট ইউজারকে পাঠানো
export async function sendNotificationToUser(
    client: MongoClient, 
    userId: string, 
    title: string, 
    body: string, 
    imageUrl: string = '', 
    url: string = '/'
) {
  try {
    const db = client.db(DB_NAME);
    
    // ডাটাবেসে সেভ (Image URL সহ)
    await db.collection(NOTIFICATIONS_COLLECTION).insertOne({
        userId: new ObjectId(userId),
        title,
        message: body,
        image: imageUrl,
        link: url,
        isRead: false,
        createdAt: new Date()
    });

    const tokensDocs = await db.collection(SUBSCRIPTIONS_COLLECTION).find({ 
        userId: new ObjectId(userId) 
    }).toArray();

    const tokens = tokensDocs.map(doc => doc.token);
    if (tokens.length === 0) return;

    // ★★★ এই অংশটিই আসল ফিক্স (Universal Image Payload) ★★★
    const messagePayload: any = {
      tokens,
      // 1. Basic Notification (iOS/Web)
      notification: { 
          title, 
          body,
      },
      // 2. Data Payload (Capacitor & Custom Handlers)
      // আমরা ইমেজ লিংকটি data-তেও পাঠাচ্ছি, কারণ অনেক প্লাগিন এখান থেকে ছবি লোড করে
      data: { 
        url,
        title,
        body,
        // ইমেজের জন্য সব ধরণের কি-ওয়ার্ড ব্যবহার করছি যাতে মিস না হয়
        image: imageUrl || "",
        imageUrl: imageUrl || "", 
        picture: imageUrl || "",
        style: "picture", // কিছু প্লাগিন এই স্টাইল চেক করে
        picture_url: imageUrl || ""
      },
      // 3. Android Specific (System Tray)
      android: {
        priority: 'high',
        ttl: 86400 * 1000,
        notification: {
          icon: 'ic_stat_icon', // এই আইকনটি res/drawable ফোল্ডারে থাকতে হবে
          color: '#f97316',
          channelId: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
          priority: 'high',
          visibility: 'public',
        }
      }
    };

    // যদি ইমেজ থাকে, তবেই Android নোটিফিকেশনে অ্যাড করব
    if (imageUrl) {
        messagePayload.notification.imageUrl = imageUrl; // For basic support
        messagePayload.android.notification.imageUrl = imageUrl; // For Android System
        messagePayload.android.notification.image = imageUrl; // Backup key
    }

    await messaging.sendEachForMulticast(messagePayload);

    console.log(`Notification sent to user ${userId} with image: ${imageUrl}`);

  } catch (error) {
    console.error("Error sending user notification:", error);
  }
}

// ২. সবাইকে পাঠানো (ব্রডকাস্ট)
export async function sendNotificationToAllUsers(
    client: MongoClient, 
    title: string, 
    body: string, 
    imageUrl: string = '', 
    url: string = '/'
) {
    try {
        const db = client.db(DB_NAME);
        
        // হিস্ট্রি সেভ (অপ্টিমাইজড)
        const users = await db.collection(USERS_COLLECTION).find({}, { projection: { _id: 1 } }).toArray();
        if (users.length > 0) {
             const notificationsToSave = users.map(u => ({
                userId: u._id,
                title,
                message: body,
                image: imageUrl,
                link: url,
                isRead: false,
                createdAt: new Date()
            }));
            await db.collection(NOTIFICATIONS_COLLECTION).insertMany(notificationsToSave);
        }

        // ★★★ ব্রডকাস্টের জন্যও একই ফিক্স ★★★
        const messagePayload: any = {
            topic: 'all_users',
            notification: { 
                title, 
                body,
            },
            data: { 
                url, 
                title, 
                body,
                image: imageUrl || "",
                imageUrl: imageUrl || "",
                picture: imageUrl || "",
                style: "picture"
            },
            android: {
                priority: 'high',
                ttl: 86400 * 1000,
                notification: {
                    icon: 'ic_stat_icon',
                    color: '#f97316',
                    channelId: 'default',
                    defaultSound: true,
                    defaultVibrateTimings: true,
                    priority: 'high',
                    visibility: 'public'
                }
            }
        };

        if (imageUrl) {
            messagePayload.notification.imageUrl = imageUrl;
            messagePayload.android.notification.imageUrl = imageUrl;
            messagePayload.android.notification.image = imageUrl;
        }

        await messaging.send(messagePayload);

        console.log(`Broadcast notification sent: ${title}`);

    } catch (error) {
        console.error("Error broadcasting notification:", error);
    }
}

// ৩. অ্যাডমিন নোটিফিকেশন
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