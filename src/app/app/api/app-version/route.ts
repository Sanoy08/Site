// src/app/api/app-version/route.ts

import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    const settings = await db.collection('settings').findOne({ type: 'general' });

    return NextResponse.json({
      success: true,
      latestVersion: settings?.androidVersion || '1.0.0',
      apkUrl: settings?.apkUrl || '',
      forceUpdate: settings?.forceUpdate || false
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}