// src/app/api/admin/daily-special/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher';
import { verifyAdmin } from '@/lib/auth-utils';
import { bumpHomeVersion } from '@/lib/version';
import { ObjectId } from 'mongodb';

const DB_NAME = 'BumbasKitchenDB';
const SPECIALS_COLLECTION = 'todaysSpecials';
const MENU_COLLECTION = 'menuItems';

export async function GET(request: NextRequest) {
  try {
    if (!await verifyAdmin(request)) {
       return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // 1. Fetch all items from the dedicated 'todaysSpecials' collection
    const specials = await db.collection(SPECIALS_COLLECTION)
      .find({})
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    const formattedSpecials = specials.map(s => ({
        _id: s._id.toString(),
        dishId: s.dishId || '',
        name: s.name,
        price: s.price,
        description: s.description || '',
        category: s.category || 'Special',
        mealType: s.mealType || 'both', // 'lunch' | 'dinner' | 'both'
        date: s.date || '',
        imageUrl: s.imageUrl || (s.images?.[0]?.url) || '',
        images: s.images || [],
        inStock: s.inStock !== false,
        stock: s.stock ?? 100,
        active: s.active !== false
    }));

    // 2. Fetch available dishes from menuItems, STRICTLY EXCLUDING THALIS
    const menuItems = await db.collection(MENU_COLLECTION)
      .find({ InStock: true })
      .sort({ Category: 1, Name: 1 })
      .toArray();

    const availableDishes = menuItems
      .filter(m => {
        const cat = (m.Category || '').toLowerCase();
        const name = (m.Name || '').toLowerCase();
        // Strictly exclude Thalis (a separate section will be built for them later)
        return !name.includes('thali') && cat !== 'thali' && !name.includes('dinner');
      })
      .map(m => ({
        _id: m._id.toString(),
        name: m.Name,
        price: m.Price,
        category: m.Category || 'General',
        description: m.Description || '',
        imageUrl: m.ImageURLs?.[0] || '',
        ImageURLs: m.ImageURLs || [],
        inStock: m.InStock !== false
      }));

    return NextResponse.json({
      success: true,
      data: formattedSpecials,
      availableDishes: availableDishes
    });

  } catch (error: any) {
    console.error("GET Daily Special Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(SPECIALS_COLLECTION);
    const { action } = body;

    // ACTION: Bulk Add Dishes with single date & mealType
    if (action === 'bulk-add') {
      const { dishIds, mealType, date } = body;
      if (!Array.isArray(dishIds) || dishIds.length === 0) {
        return NextResponse.json({ success: false, error: 'Please select at least one dish' }, { status: 400 });
      }

      const validObjIds = dishIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
      const sourceDishes = await db.collection(MENU_COLLECTION)
        .find({ _id: { $in: validObjIds } })
        .toArray();

      if (sourceDishes.length === 0) {
        return NextResponse.json({ success: false, error: 'No matching dishes found' }, { status: 404 });
      }

      const targetDate = date || new Date().toISOString().split('T')[0];
      const targetMealType = mealType || 'both';

      const newSpecials = sourceDishes.map(d => ({
        dishId: d._id.toString(),
        name: d.Name,
        price: d.Price, // Directly use menu price without manual rate editing
        description: d.Description || '',
        category: d.Category || 'Special',
        mealType: targetMealType, // 'lunch' | 'dinner' | 'both'
        date: targetDate,
        imageUrl: d.ImageURLs?.[0] || '',
        images: d.ImageURLs?.[0] ? [{ id: 'img-0', url: d.ImageURLs[0], alt: d.Name }] : [],
        inStock: true,
        stock: 100,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await collection.insertMany(newSpecials);

      await bumpHomeVersion();
      revalidatePath('/');
      await pusherServer.trigger('menu-updates', 'product-changed', {
        message: `${newSpecials.length} dishes added to Today's Specials!`,
        type: 'update'
      });

      return NextResponse.json({
        success: true,
        message: `Added ${newSpecials.length} dishes to Today's Special for ${targetDate} (${targetMealType})`
      });
    }

    // ACTION: Delete single special item
    if (action === 'delete') {
      const { id } = body;
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Valid Special ID is required' }, { status: 400 });
      }

      await collection.deleteOne({ _id: new ObjectId(id) });

      await bumpHomeVersion();
      revalidatePath('/');
      await pusherServer.trigger('menu-updates', 'product-changed', {
        message: "Special dish removed",
        type: 'update'
      });

      return NextResponse.json({ success: true, message: 'Special dish removed' });
    }

    // ACTION: Bulk Delete or Clear by Date
    if (action === 'bulk-delete') {
      const { ids } = body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ success: false, error: 'No IDs provided' }, { status: 400 });
      }

      const validIds = ids.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
      await collection.deleteMany({ _id: { $in: validIds } });

      await bumpHomeVersion();
      revalidatePath('/');
      await pusherServer.trigger('menu-updates', 'product-changed', {
        message: "Selected specials removed",
        type: 'update'
      });

      return NextResponse.json({ success: true, message: `Removed ${validIds.length} specials` });
    }

    // ACTION: Toggle inStock status
    if (action === 'toggle-stock') {
      const { id, inStock } = body;
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Valid Special ID is required' }, { status: 400 });
      }

      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { inStock: Boolean(inStock), updatedAt: new Date() } }
      );

      await bumpHomeVersion();
      revalidatePath('/');
      await pusherServer.trigger('menu-updates', 'product-changed', {
        message: "Stock status changed",
        type: 'update'
      });

      return NextResponse.json({ success: true, message: 'Stock updated' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error("POST Daily Special Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update daily special" }, { status: 500 });
  }
}
