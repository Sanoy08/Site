import { MongoClient } from 'mongodb';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const messaging = admin.messaging();

async function sendTestNotification() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db('BumbasKitchenDB');

  // ONLY get tokens for the NEW app (com.bumbaskitchenadmin.app)
  const targetAppId = 'com.bumbaskitchenadmin.app';
  const newAppDocs = await db.collection('subscriptions').find({ appId: targetAppId }).toArray();
  const tokens = newAppDocs.map(d => d.token).filter(Boolean);

  console.log(`Found ${tokens.length} token(s) for ${targetAppId}`);
  if (tokens.length === 0) {
    console.log('No tokens found for ' + targetAppId);
    await client.close();
    return;
  }

  // Send specifically to this token / tokens
  const payload = {
    tokens,
    notification: {
      title: '🔔 New Admin App Test Alert!',
      body: 'Testing notification on NEW admin app (com.bumbaskitchenadmin.app) with custom sound!',
    },
    data: {
      url: '/orders',
      orderId: 'TEST-ORDER-101',
      channelId: 'admin_order_alert_v2',
      android_channel_id: 'admin_order_alert_v2',
      sound: 'my_alert',
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'admin_order_alert_v2',
        sound: 'my_alert',
        color: '#e11d48',
        defaultSound: false,
        defaultVibrateTimings: true,
      },
    },
  };

  console.log('Dispatching multicast message to Firebase FCM...');
  const response = await messaging.sendEachForMulticast(payload);
  console.log('Send completed!');
  console.log(`Success count: ${response.successCount}`);
  console.log(`Failure count: ${response.failureCount}`);
  if (response.failureCount > 0) {
    for (let i = 0; i < response.responses.length; i++) {
      const r = response.responses[i];
      if (!r.success) {
        console.error(`Token ${i + 1} error:`, r.error?.message || r.error);
        if (r.error?.code === 'messaging/registration-token-not-registered') {
          console.log(`Cleaning up dead token: ${tokens[i]}`);
          await db.collection('subscriptions').deleteOne({ token: tokens[i] });
        }
      }
    }
  }

  await client.close();
}

sendTestNotification();
