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
    
    // 1. Fetch all items from todaysSpecials collection
    const specials = await db.collection(SPECIALS_COLLECTION)
      .find({})
      .sort({ date: -1, createdAt: 1 })
      .toArray();

    // 2. Fetch all menuItems to populate live master details
    const menuItems = await db.collection(MENU_COLLECTION)
      .find({})
      .sort({ Category: 1, Name: 1 })
      .toArray();

    const menuMap = new Map();
    menuItems.forEach(m => {
      menuMap.set(m._id.toString(), m);
      if (m.Name) menuMap.set(m.Name.toLowerCase().trim(), m);
    });

    const formattedSpecials = specials.map(s => {
      const dish = menuMap.get(s.dishId?.toString()) || menuMap.get((s.dishName || s.name || '').toLowerCase().trim()) || {};
      const dishName = s.dishName || dish.Name || s.name || 'Special Dish';
      const dishPrice = dish.Price ?? s.price ?? 0;
      const imageUrl = dish.ImageURLs?.[0] || s.imageUrl || (s.images?.[0]?.url) || '';

      return {
        _id: s._id.toString(),
        dishId: s.dishId?.toString() || dish._id?.toString() || '',
        name: dishName,
        price: dishPrice,
        description: dish.Description || s.description || '',
        category: dish.Category || s.category || 'Special',
        mealType: s.mealType || 'lunch', // 'lunch' | 'dinner'
        date: s.date || '',
        imageUrl: imageUrl,
        images: dish.ImageURLs?.map((url: string, i: number) => ({ id: `img-${i}`, url, alt: dishName })) || s.images || [],
        inStock: (dish.InStock !== false) && (s.active !== false),
        stock: 100,
        active: s.active !== false,
        createdAt: s.createdAt
      };
    });

    // 3. Available dishes from menuItems, STRICTLY EXCLUDING THALIS
    const availableDishes = menuItems
      .filter(m => {
        const cat = (m.Category || '').toLowerCase();
        const name = (m.Name || '').toLowerCase();
        // Strictly exclude Thalis (a separate section will be built for them later)
        return m.InStock !== false && !name.includes('thali') && cat !== 'thali' && !name.includes('dinner');
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
    console.error('GET Daily Special Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
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

    // ACTION: Bulk Add Dishes with duplicate prevention and lightweight reference storage
    if (action === 'bulk-add') {
      const { dishIds, mealType, date, items } = body;
      const targetDate = date || new Date().toISOString().split('T')[0];

      // Support multi-batch { items: [{ dishIds: string[], mealType: 'lunch' | 'dinner' }] } or legacy { dishIds, mealType }
      let batches: Array<{ dishIds: string[]; mealType: 'lunch' | 'dinner' }> = [];

      if (Array.isArray(items) && items.length > 0) {
        batches = items
          .map((it: any) => ({
            dishIds: Array.isArray(it.dishIds) ? it.dishIds : [],
            mealType: (it.mealType === 'dinner' ? 'dinner' : 'lunch') as 'lunch' | 'dinner',
          }))
          .filter((b) => b.dishIds.length > 0);
      } else if (Array.isArray(dishIds) && dishIds.length > 0) {
        batches = [
          {
            dishIds,
            mealType: (mealType === 'dinner' ? 'dinner' : 'lunch') as 'lunch' | 'dinner',
          },
        ];
      }

      if (batches.length === 0) {
        return NextResponse.json({ success: false, error: 'Please select at least one dish' }, { status: 400 });
      }

      // Collect all unique dish IDs
      const allDishIds = Array.from(new Set(batches.flatMap((b) => b.dishIds)));
      const validObjIds = allDishIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
      const sourceDishes = await db.collection(MENU_COLLECTION)
        .find({ _id: { $in: validObjIds } })
        .toArray();

      if (sourceDishes.length === 0) {
        return NextResponse.json({ success: false, error: 'No matching dishes found' }, { status: 404 });
      }

      const dishMap = new Map();
      sourceDishes.forEach((d) => {
        dishMap.set(d._id.toString(), d);
      });

      // Existing specials for date
      const existingForDate = await collection.find({ date: targetDate }).toArray();

      const newSpecials: any[] = [];
      let totalSkipped = 0;

      for (const batch of batches) {
        const bMealType = batch.mealType;
        // Duplicate prevention is per mealType (dishes can be both in lunch and dinner, but not duplicated inside the same mealType)
        const existingForMeal = existingForDate.filter(
          (s) => s.mealType === bMealType || s.mealType === 'both'
        );
        const existingDishIds = new Set(existingForMeal.map((s) => s.dishId?.toString()).filter(Boolean));
        const existingNames = new Set(existingForMeal.map((s) => (s.dishName || s.name)?.toLowerCase().trim()));

        // Also ensure not duplicating within the current request batch
        const currentBatchAddedIds = new Set(
          newSpecials.filter((s) => s.mealType === bMealType).map((s) => s.dishId?.toString())
        );

        for (const id of batch.dishIds) {
          const d = dishMap.get(id);
          if (!d) continue;

          const dNameLower = d.Name?.toLowerCase().trim();
          if (
            existingDishIds.has(d._id.toString()) ||
            existingNames.has(dNameLower) ||
            currentBatchAddedIds.has(d._id.toString())
          ) {
            totalSkipped++;
            continue;
          }

          newSpecials.push({
            dishId: d._id.toString(),
            dishName: d.Name,
            name: d.Name,
            date: targetDate,
            mealType: bMealType,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      if (newSpecials.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: "Selected dish(es) are already added to Today's Special for this meal type." 
        }, { status: 400 });
      }

      try {
        await collection.insertMany(newSpecials);
      } catch (insertErr: any) {
        if (insertErr?.code === 11000) {
          return NextResponse.json({
            success: false,
            error: "One or more dishes are already added for this meal type on this date."
          }, { status: 400 });
        }
        throw insertErr;
      }

      await bumpHomeVersion();
      revalidatePath('/');
      await pusherServer.trigger('menu-updates', 'product-changed', {
        message: `${newSpecials.length} dishes added to Today's Specials!`,
        type: 'update',
      });

      let msg = `Added ${newSpecials.length} dish(es) to Today's Special for ${targetDate}`;
      if (totalSkipped > 0) {
        msg += ` (${totalSkipped} already existed in that meal and were skipped)`;
      }

      return NextResponse.json({
        success: true,
        message: msg,
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
        message: 'Special dish removed',
        type: 'update'
      });

      return NextResponse.json({ success: true, message: 'Special dish removed' });
    }

    // ACTION: Bulk Delete
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
        message: 'Selected specials removed',
        type: 'update'
      });

      return NextResponse.json({ success: true, message: `Removed ${validIds.length} specials` });
    }

    // ACTION: Toggle active status
    if (action === 'toggle-stock' || action === 'toggle-active') {
      const { id, inStock, active } = body;
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Valid Special ID is required' }, { status: 400 });
      }

      const newActive = active !== undefined ? Boolean(active) : (inStock !== undefined ? Boolean(inStock) : true);

      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { active: newActive, updatedAt: new Date() } }
      );

      await bumpHomeVersion();
      revalidatePath('/');
      await pusherServer.trigger('menu-updates', 'product-changed', {
        message: 'Special status changed',
        type: 'update'
      });

      return NextResponse.json({ success: true, message: 'Status updated' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('POST Daily Special Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to update daily special' 
    }, { status: 500 });
  }
}
