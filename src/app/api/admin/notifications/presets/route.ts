// src/app/api/admin/notifications/presets/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    const [presets, history] = await Promise.all([
        db.collection('notificationPresets').find({}).toArray(),
        db.collection('notificationHistory').find({}).sort({ sentAt: -1 }).limit(20).toArray()
    ]);

    return NextResponse.json({ success: true, presets, history });
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    await db.collection('notificationPresets').insertOne({
        ...body,
        timeSlot: body.timeSlot || 'anytime', // ★ Default to anytime if missing
        isActive: true,
        createdAt: new Date()
    });

    return NextResponse.json({ success: true, message: "Preset Saved!" });
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const client = await clientPromise;
    await client.db('BumbasKitchenDB').collection('notificationPresets').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: "Deleted" });
}