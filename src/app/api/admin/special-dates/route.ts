// src/app/api/admin/special-dates/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAdmin } from '@/lib/auth-utils'; // ★★★ কুকি চেকার ইম্পোর্ট

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION = 'specialDates';

// GET: সব ইভেন্ট দেখা
export async function GET(request: NextRequest) {
  try {
    // ১. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক (GET এও যোগ করা হলো)
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    // তারিখ অনুযায়ী সাজিয়ে পাঠানো (আসন্ন ইভেন্ট আগে)
    const events = await db.collection(COLLECTION).find({}).sort({ date: 1 }).toArray();
    
    return NextResponse.json({ 
        success: true, 
        events: events.map(event => ({
            id: event._id.toString(),
            title: event.title,
            date: event.date,
            type: event.type,
            imageUrl: event.imageUrl
        }))
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: নতুন ইভেন্ট যোগ করা
export async function POST(request: NextRequest) {
  try {
    // ২. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, date, type, imageUrl } = body;

    if (!title || !date || !type) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const newEvent = {
        title,
        date: new Date(date), // ISO Date অবজেক্ট হিসেবে সেভ করা
        type,
        imageUrl: imageUrl || null,
        createdAt: new Date()
    };

    await db.collection(COLLECTION).insertOne(newEvent);
    return NextResponse.json({ success: true, message: 'Event added successfully' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: ইভেন্ট ডিলিট করা
export async function DELETE(request: NextRequest) {
    try {
      // ৩. ★★★ সিকিউরিটি ফিক্স: কুকি থেকে অ্যাডমিন চেক
      if (!await verifyAdmin(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
  
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
  
      if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
  
      const client = await clientPromise;
      const db = client.db(DB_NAME);
      
      await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
      
      return NextResponse.json({ success: true, message: 'Event deleted' });
  
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }