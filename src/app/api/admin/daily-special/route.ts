// src/app/api/admin/daily-special/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { revalidatePath } from 'next/cache';
import { pusherServer } from '@/lib/pusher';
import { sendNotificationToAllUsers } from '@/lib/notification';
import { verifyAdmin } from '@/lib/auth-utils';
import { bumpHomeVersion } from '@/lib/version';
import { ObjectId } from 'mongodb';

const DB_NAME = 'BumbasKitchenDB';
const COLLECTION_NAME = 'menuItems';

export async function GET(request: NextRequest) {
  try {
    if (!await verifyAdmin(request)) {
       return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Fetch all menu items
    const allItems = await db.collection(COLLECTION_NAME)
      .find({})
      .sort({ isDailySpecial: -1, Category: 1, Name: 1 })
      .toArray();

    const formattedAll = allItems.map(item => ({
        _id: item._id.toString(),
        name: item.Name,
        price: item.Price,
        description: item.Description || '',
        category: item.Category || 'Other',
        ImageURLs: item.ImageURLs || [],
        imageUrl: item.ImageURLs?.[1] || item.ImageURLs?.[0] || '',
        inStock: item.InStock !== false,
        isDailySpecial: item.isDailySpecial === true || item.isDailySpecial === "true"
    }));

    const specialItems = formattedAll.filter(item => item.isDailySpecial);

    return NextResponse.json({
      success: true,
      data: specialItems,
      allItems: formattedAll
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
    const collection = db.collection(COLLECTION_NAME);

    // ACTION 1: Quick toggle single item as Daily Special
    if (body.action === 'toggle-special') {
      const { id, isDailySpecial } = body;
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Invalid or missing Menu ID' }, { status: 400 });
      }

      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { isDailySpecial: Boolean(isDailySpecial), UpdatedAt: new Date() } }
      );

      await bumpHomeVersion();
      revalidatePath('/menus');
      revalidatePath('/');

      await pusherServer.trigger('menu-updates', 'product-changed', {
        message: "Today's Special Updated! ⭐",
        type: 'update'
      });

      return NextResponse.json({
        success: true,
        message: isDailySpecial ? "Item added to Today's Special" : "Item removed from Today's Special"
      });
    }

    // ACTION 2: Batch update active Daily Special items
    if (body.action === 'batch-set-specials') {
      const { selectedIds } = body;
      if (!Array.isArray(selectedIds)) {
        return NextResponse.json({ success: false, error: 'selectedIds must be an array' }, { status: 400 });
      }

      const validObjIds = selectedIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));

      // Mark selected as true
      if (validObjIds.length > 0) {
        await collection.updateMany(
          { _id: { $in: validObjIds } },
          { $set: { isDailySpecial: true, UpdatedAt: new Date() } }
        );
      }

      // Mark unselected as false
      await collection.updateMany(
        { _id: { $nin: validObjIds } },
        { $set: { isDailySpecial: false, UpdatedAt: new Date() } }
      );

      await bumpHomeVersion();
      revalidatePath('/menus');
      revalidatePath('/');

      await pusherServer.trigger('menu-updates', 'product-changed', {
        message: "Today's Specials Updated! ⭐",
        type: 'update'
      });

      return NextResponse.json({
        success: true,
        message: "Updated Today's Specials (" + validObjIds.length + " items active)"
      });
    }

    // ACTION 3: Standard Menu Details & Poster Update
    const { id, name, price, items, ImageURLs, imageUrl, inStock, isDailySpecial, notifyUsers } = body;

    if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Invalid or missing Menu ID' }, { status: 400 });
    }

    const description = Array.isArray(items) ? items.map((item) => "• " + item).join('\n') : '';

    const productData = {
        Name: name,
        Price: parseFloat(price),
        Description: description,
        ImageURLs: ImageURLs || (imageUrl ? [imageUrl] : []),
        InStock: inStock !== false,
        UpdatedAt: new Date()
    };

    if (isDailySpecial !== undefined) {
      productData.isDailySpecial = Boolean(isDailySpecial);
    }

    const updateResult = await collection.updateOne(
        { _id: new ObjectId(id) }, 
        { $set: productData }
    );

    if (updateResult.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Menu item not found in database' }, { status: 404 });
    }

    // Bump home version for mobile app cache invalidation
    await bumpHomeVersion();
    revalidatePath('/menus');
    revalidatePath('/');

    // Frontend Realtime Trigger
    await pusherServer.trigger('menu-updates', 'product-changed', {
        message: name + " Updated! 🍛",
        type: 'update'
    });

    // Notification Logic
    if (notifyUsers) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
        
        await sendNotificationToAllUsers(
            client,
            "Today's Special Updated! 🍛",
            name + " is ready! Order before it runs out.",
            imageUrl || (ImageURLs && ImageURLs[1]) || "", 
            "/menus/" + slug
        ).catch(console.error);
    }

    return NextResponse.json({ success: true, message: 'Daily menu updated successfully' });

  } catch (error) {
    console.error("POST Daily Special Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update menu" }, { status: 500 });
  }
}
