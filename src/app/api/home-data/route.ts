// src/app/api/home-data/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

const DB_NAME = 'BumbasKitchenDB';

export async function GET(request: NextRequest) {
  try {
    const clientVersion = parseInt(request.nextUrl.searchParams.get('v') || '0');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // 1. Check current home version
    const versionDoc = await db.collection('appSettings').findOne({ _id: 'home_version' });
    const currentDbVersion = versionDoc ? versionDoc.version : 1;

    // 2. Return early if version matches
    if (clientVersion === currentDbVersion) {
        return NextResponse.json({ upToDate: true, version: currentDbVersion });
    }

    // 3. Parallel fetch
    const [heroSlides, sliderImages, offers, menuItems, megaCampaignDoc, todaysSpecialsDoc] = await Promise.all([
        db.collection('heroSlides').find({}).sort({ order: 1 }).toArray(),
        db.collection('homeSliderImages').find({}).sort({ order: 1 }).toArray(),
        db.collection('offers').find({ active: true }).sort({ createdAt: -1 }).toArray(),
        db.collection('menuItems').find({}).sort({ InStock: -1, Name: 1 }).toArray(),
        db.collection('megacampaign').findOne({ _id: 'main' }),
        db.collection('todaysSpecials').find({ active: { $ne: false } }).sort({ date: 1, createdAt: 1 }).toArray()
    ]);

    // IST date formatting
    const todayDate = new Date();
    todayDate.setHours(todayDate.getHours() + 5);
    todayDate.setMinutes(todayDate.getMinutes() + 30);
    const todayStr = todayDate.toISOString().split('T')[0];

    // Lazy cleanup of past special offers
    const expiredOfferIds = offers
        .filter(o => o.deliveryDate && todayStr > o.deliveryDate)
        .map(o => o._id);

    let validOffers = offers;
    if (expiredOfferIds.length > 0) {
        await db.collection('offers').deleteMany({ _id: { $in: expiredOfferIds } });
        validOffers = offers.filter(o => !expiredOfferIds.includes(o._id));
    }

    // Lazy cleanup of past daily specials
    await db.collection('todaysSpecials').deleteMany({ date: { $lt: todayStr } });

    // Lookup map of menuItems for live data
    const menuMap = new Map();
    menuItems.forEach(m => {
      menuMap.set(m._id.toString(), m);
      if (m.Name) menuMap.set(m.Name.toLowerCase().trim(), m);
    });

    // Format Today's Specials populated with live menuItems data (Strictly exclude Thalis!)
    const formattedTodaysSpecials = (todaysSpecialsDoc || [])
      .filter(s => {
        // Exclude past dates
        if (s.date && s.date < todayStr) return false;
        return true;
      })
      .map(s => {
        const dish = menuMap.get(s.dishId?.toString()) || menuMap.get((s.dishName || s.name || '').toLowerCase().trim());
        const dishName = s.dishName || dish?.Name || s.name || '';
        const nameLower = dishName.toLowerCase();
        const catName = dish?.Category || s.category || 'Special';
        const catLower = catName.toLowerCase();

        // Strictly exclude Thalis
        if (nameLower.includes('thali') || catLower === 'thali') {
          return null;
        }

        const imagesList = (dish?.ImageURLs && dish.ImageURLs.length > 0)
          ? dish.ImageURLs.map((url: string, i: number) => ({ id: `img-${i}`, url, alt: dishName }))
          : (s.images && s.images.length > 0 ? s.images : (s.imageUrl ? [{ id: 'img-0', url: s.imageUrl, alt: dishName }] : []));

        return {
          id: s._id.toString(),
          dishId: s.dishId ? s.dishId.toString() : (dish?._id ? dish._id.toString() : ''),
          name: dishName,
          description: dish?.Description || s.description || '',
          price: dish?.Price ?? s.price ?? 0,
          category: { id: catLower, name: catName },
          type: dish?.type || (catLower.includes('veg') ? 'veg' : 'non-veg'),
          mealType: s.mealType || 'both', // 'lunch' | 'dinner' | 'both'
          deliveryDate: s.date || todayStr,
          date: s.date || todayStr,
          images: imagesList,
          stock: (dish?.InStock !== false && s.active !== false) ? 100 : 0,
          isDailySpecial: true,
          slug: dishName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, ''),
          rating: dish?.Rating || s.rating || 4.8
        };
      })
      .filter(Boolean);

    // Track active special dish IDs and names to HIDE them from regular catalog & search bar
    const activeSpecialDishIds = new Set(
      formattedTodaysSpecials.map((s: any) => s.dishId).filter(Boolean)
    );
    const activeSpecialNames = new Set(
      formattedTodaysSpecials.map((s: any) => s.name?.toLowerCase().trim()).filter(Boolean)
    );

    // Format Regular Products
    const formatProduct = (item: any) => ({
        id: item._id.toString(),
        name: item.Name || 'Unknown Dish',
        description: item.Description || '',
        price: item.Price || 0,
        category: { id: (item.Category || '').toLowerCase(), name: item.Category || 'Other' },
        type: item.type || 'veg',
        images: item.ImageURLs?.map((url: string, i: number) => ({ id: `img-${i}`, url, alt: item.Name })) || [],
        stock: item.InStock ? 100 : 0,
        featured: item.Bestseller === "true" || item.Bestseller === true,
        isDailySpecial: false,
        slug: (item.Name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, ''),
        rating: item.rating || item.Rating || 4.5
    });

    // Exclude Today's Special dishes from regular catalog so they NEVER show duplicate in search bar or regular list!
    const regularCatalogProducts = menuItems
      .filter(m => {
        const mId = m._id.toString();
        const mName = (m.Name || '').toLowerCase().trim();
        return !activeSpecialDishIds.has(mId) && !activeSpecialNames.has(mName);
      })
      .map(formatProduct);

    const bestsellers = regularCatalogProducts.filter(p => p.featured);

    return NextResponse.json({ 
        upToDate: false, 
        version: currentDbVersion, 
        data: { 
            heroSlides: heroSlides.map(s => ({ id: s._id.toString(), imageUrl: s.imageUrl, clickUrl: s.clickUrl, order: s.order })), 
            sliderImages: sliderImages.map(s => ({ id: s._id.toString(), imageUrl: s.imageUrl, clickUrl: s.clickUrl, order: s.order })), 
            offers: validOffers.map(o => ({ 
                id: o._id.toString(), 
                title: o.title, 
                description: o.description, 
                price: o.price, 
                imageUrl: o.imageUrl,
                isSpecialOffer: o.isSpecialOffer || false,
                deliveryDate: o.deliveryDate || '',
                orderCutoffTime: o.orderCutoffTime || '',
                mealType: o.mealType || 'lunch'
            })), 
            bestsellers,
            allProducts: regularCatalogProducts, // Only regular products — Today's Specials are hidden from search!
            todaysSpecials: formattedTodaysSpecials, // Shown exclusively in Homepage Today's Special section!
            megaCampaign: (megaCampaignDoc && megaCampaignDoc.isActive) ? megaCampaignDoc : null
        } 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
