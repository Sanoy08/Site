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
    
    // ডাটাবেসে সেভ
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

    // ★ আপডেট: imageUrl ব্যবহার করা হচ্ছে এবং data-তেও পাঠানো হচ্ছে
    await messaging.sendEachForMulticast({
      tokens,
      notification: { 
          title, 
          body,
          ...(imageUrl && { imageUrl: imageUrl }) // Node.js SDK তে 'imageUrl' সঠিক
      },
      data: { 
          url,
          // Capacitor বা কাস্টম হ্যান্ডলারের জন্য data-তেও ইমেজ পাঠানো হলো
          ...(imageUrl && { image: imageUrl }),
          ...(imageUrl && { picture: imageUrl }) 
      },
      android: {
        priority: 'high',
        ttl: 86400 * 1000,
        notification: {
          // আপনার অ্যাপে যদি 'ic_stat_icon' না থাকে তবে নিচের লাইনটি কমেন্ট করে দিন
          // icon: 'ic_stat_icon', 
          color: '#f97316',
          channelId: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
          ...(imageUrl && { imageUrl: imageUrl }) // অ্যান্ড্রয়েড স্পেসিফিক কনফিগ
        }
      }
    });

    console.log(`Notification sent to user ${userId}: ${title}`);

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

        // ★ আপডেট
        await messaging.send({
            topic: 'all_users',
            notification: { 
                title, 
                body,
                ...(imageUrl && { imageUrl: imageUrl }) 
            },
            data: { 
                url,
                ...(imageUrl && { image: imageUrl }),
                ...(imageUrl && { picture: imageUrl })
            },
            android: {
                priority: 'high',
                ttl: 86400 * 1000,
                notification: {
                    // icon: 'ic_stat_icon',
                    color: '#f97316',
                    channelId: 'default',
                    defaultSound: true,
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

// ৩. অ্যাডমিন নোটিফিকেশন
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
            data: { url },
            android: {
                priority: 'high',
                notification: {
                    // icon: 'ic_stat_icon',
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