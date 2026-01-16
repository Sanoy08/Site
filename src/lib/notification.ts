// src/lib/notification.ts
import { MongoClient, ObjectId } from 'mongodb';
import { messaging } from './firebase-admin';

const DB_NAME = 'BumbasKitchenDB';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

// ১. নির্দিষ্ট ইউজারকে পাঠানো (আপডেটেড - কাস্টম সাউন্ড)
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

    await messaging.sendEachForMulticast({
      tokens,
      notification: { 
          title, 
          body,
          ...(imageUrl && { imageUrl: imageUrl }) 
      },
      data: { 
          url,
          // ★ চ্যানেল আইডি পাঠানো হচ্ছে যাতে ফোরগ্রাউন্ডে সঠিক সাউন্ড বাজে
          android_channel_id: 'user_notifications', 
          ...(imageUrl && { image: imageUrl }),
          ...(imageUrl && { picture: imageUrl }) 
      },
      android: {
        priority: 'high',
        ttl: 86400 * 1000,
        notification: {
          icon: 'ic_stat_icon',
          color: '#f97316',
          // ★ ইউজারদের জন্য কাস্টম সাউন্ড কনফিগারেশন ★
          channelId: 'user_notifications', 
          sound: 'user_alert', // এক্সটেনশন ছাড়া নাম (user_alert.mp3)
          defaultSound: false, // ডিফল্ট বন্ধ
          defaultVibrateTimings: true,
          ...(imageUrl && { imageUrl: imageUrl })
        }
      }
    });

    console.log(`Notification sent to user ${userId}: ${title}`);

  } catch (error) {
    console.error("Error sending user notification:", error);
  }
}

// ২. সবাইকে পাঠানো (আপডেটেড - কাস্টম সাউন্ড)
export async function sendNotificationToAllUsers(
    client: MongoClient, 
    title: string, 
    body: string, 
    imageUrl: string = '', 
    url: string = '/'
) {
    try {
        const db = client.db(DB_NAME);
        
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

        await messaging.send({
            topic: 'all_users',
            notification: { 
                title, 
                body,
                ...(imageUrl && { imageUrl: imageUrl }) 
            },
            data: { 
                url,
                // ★ চ্যানেল আইডি পাঠানো হচ্ছে
                android_channel_id: 'user_notifications', 
                ...(imageUrl && { image: imageUrl }),
                ...(imageUrl && { picture: imageUrl })
            },
            android: {
                priority: 'high',
                ttl: 86400 * 1000,
                notification: {
                    icon: 'ic_stat_icon',
                    color: '#f97316',
                    // ★ ইউজারদের জন্য কাস্টম সাউন্ড কনফিগারেশন ★
                    channelId: 'user_notifications', 
                    sound: 'user_alert', // এক্সটেনশন ছাড়া নাম
                    defaultSound: false,
                    defaultVibrateTimings: true,
                    ...(imageUrl && { imageUrl: imageUrl }) 
                }
            }
        });

        console.log(`Broadcast notification sent: ${title}`);

    } catch (error) {
        console.error("Error broadcasting notification:", error);
    }
}

// ৩. অ্যাডমিন নোটিফিকেশন (অপরিবর্তিত - অ্যাডমিন সাউন্ড থাকবে)
export async function sendNotificationToAdmins(client: MongoClient, title: string, body: string, url: string = '/admin/orders') {
  try {
    const db = client.db(DB_NAME);
    const admins = await db.collection(USERS_COLLECTION).find({ role: 'admin' }).toArray();
    const adminIds = admins.map(admin => admin._id);

    if (adminIds.length === 0) return;

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
            data: { 
              url,
              android_channel_id: 'admin_order_alert' 
            },
            android: {
                priority: 'high',
                notification: {
                    icon: 'ic_stat_icon',
                    color: '#f97316',
                    channelId: 'admin_order_alert', 
                    sound: 'my_alert', 
                    defaultSound: false, 
                    defaultVibrateTimings: true
                }
            }
        });
    }
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
}