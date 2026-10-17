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

    // ACTION: Add new dish to Today's Specials
    if (action === 'add') {
      const { dishId, name, price, description, category, mealType, date, imageUrl, inStock, stock } = body;
      if (!name || !price) {
        return NextResponse.json({ success: false, error: 'Name and price are required' }, { status: 400 });
      }

      const newSpecial = {
        dishId: dishId || '',
        name: name.trim(),
        price: parseFloat(price),
        description: description || '',
        category: category || 'Special',
        mealType: mealType || 'both', // 'lunch' | 'dinner' | 'both'
        date: date || new Date().toISOString().split('T')[0],
        imageUrl: imageUrl || '',
        images: imageUrl ? [{ id: 'img-0', url: imageUrl, alt: name }] : [],
        inStock: inStock !== false,
        stock: parseInt(stock) || 100,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(newSpecial);

      await bumpHomeVersion();
      revalidatePath('/');
      await pusherServer.trigger('menu-updates', 'product-changed', {
        message: `${name} added to Today's Specials!`,
        type: 'update'
      });

      return NextResponse.json({
        success: true,
        message: `Added "${name}" to Today's Special`,
        insertedId: result.insertedId.toString()
      });
    }

    // ACTION: Update existing special item
    if (action === 'update') {
      const { id, price, mealType, date, inStock, stock, active } = body;
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Valid Special ID is required' }, { status: 400 });
      }

      const updateFields: any = { updatedAt: new Date() };
      if (price !== undefined) updateFields.price = parseFloat(price);
      if (mealType !== undefined) updateFields.mealType = mealType;
      if (date !== undefined) updateFields.date = date;
      if (inStock !== undefined) updateFields.inStock = Boolean(inStock);
      if (stock !== undefined) updateFields.stock = parseInt(stock) || 100;
      if (active !== undefined) updateFields.active = Boolean(active);

      await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

      await bumpHomeVersion();
      revalidatePath('/');
      await pusherServer.trigger('menu-updates', 'product-changed', {
        message: "Today's Special item updated",
        type: 'update'
      });

      return NextResponse.json({ success: true, message: 'Special dish updated' });
    }

    // ACTION: Delete from Today's Specials
    if (action === 'delete') {
      const { id } = body;
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Valid Special ID is required' }, { status: 400 });
      }

      await collection.deleteOne({ _id: new ObjectId(id) });

      await bumpHomeVersion();
      revalidatePath('/');
      await pusherServer.trigger('menu-updates', 'product-changed', {
        message: "Special item removed",
        type: 'update'
      });

      return NextResponse.json({ success: true, message: 'Special item removed' });
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
