// src/lib/version.ts

import { clientPromise } from '@/lib/mongodb';

export async function bumpHomeVersion() {
  try {
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    // ভার্সন নাম্বার ১ করে বাড়ানো হবে
    await db.collection('appSettings').updateOne(
      { _id: 'home_version' },
      { $inc: { version: 1 } },
      { upsert: true }
    );
  } catch (error) {
    console.error('Failed to bump version:', error);
  }
}