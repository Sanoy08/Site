// src/app/api/home-data/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

const DB_NAME = 'BumbasKitchenDB';

export async function GET(request: NextRequest) {
  try {
    const clientVersion = parseInt(request.nextUrl.searchParams.get('v') || '0');
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // ১. ডাটাবেসের বর্তমান ভার্সন চেক
    const versionDoc = await db.collection('appSettings').findOne({ _id: 'home_version' });
    const currentDbVersion = versionDoc ? versionDoc.version : 1;

    // ২. ভার্সন মিলে গেলে ডেটা পাঠানো হবে না! 
    if (clientVersion === currentDbVersion) {
        return NextResponse.json({ upToDate: true, version: currentDbVersion });
    }

    // ৩. ভার্সন না মিললে প্যারালাল ফেচিং
    const [heroSlides, sliderImages, offers, products, megaCampaignDoc, todaysSpecialsDoc] = await Promise.all([
        db.collection('heroSlides').find({}).sort({ order: 1 }).toArray(),
        db.collection('homeSliderImages').find({}).sort({ order: 1 }).toArray(),
        db.collection('offers').find({ active: true }).sort({ createdAt: -1 }).toArray(),
        db.collection('menuItems').find({}).sort({ InStock: -1, Name: 1 }).toArray(),
        db.collection('megacampaign').findOne({ _id: 'main' }),
        db.collection('todaysSpecials').find({ active: { $ne: false }, inStock: { $ne: false } }).sort({ date: 1, createdAt: -1 }).toArray()
    ]);

    // ★ Auto-delete expired special offers (Lazy Deletion)
    const todayDate = new Date();
    todayDate.setHours(todayDate.getHours() + 5);
    todayDate.setMinutes(todayDate.getMinutes() + 30);
    const todayStr = todayDate.toISOString().split('T')[0];

    const expiredOfferIds = offers
        .filter(o => o.deliveryDate && todayStr > o.deliveryDate)
        .map(o => o._id);

    let validOffers = offers;
    if (expiredOfferIds.length > 0) {
        await db.collection('offers').deleteMany({ _id: { $in: expiredOfferIds } });
        validOffers = offers.filter(o => !expiredOfferIds.includes(o._id));
    }

    // ★ Format Regular Products (Exclude isDailySpecial flag from thalis)
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
        isDailySpecial: false, // Dedicated specials collection is now used!
        slug: (item.Name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, ''),
        rating: item.rating || item.Rating || 4.5
    });

    const formattedProducts = products.map(formatProduct);
    const bestsellers = formattedProducts.filter(p => p.featured);

    // ★ Format Today's Specials from dedicated 'todaysSpecials' collection (No Thalis!)
    const formattedTodaysSpecials = (todaysSpecialsDoc || [])
      .filter(s => {
        const nameLower = (s.name || '').toLowerCase();
        const catLower = (s.category || '').toLowerCase();
        return !nameLower.includes('thali') && catLower !== 'thali';
      })
      .map(s => {
        const imagesList = s.images && s.images.length > 0 
          ? s.images 
          : (s.imageUrl ? [{ id: 'img-0', url: s.imageUrl, alt: s.name }] : []);

        return {
          id: s._id.toString(),
          dishId: s.dishId ? s.dishId.toString() : '',
          name: s.name,
          description: s.description || '',
          price: s.price || 0,
          category: { id: (s.category || 'special').toLowerCase(), name: s.category || 'Special' },
          type: s.type || (s.category?.toLowerCase().includes('veg') ? 'veg' : 'non-veg'),
          mealType: s.mealType || 'both', // 'lunch' | 'dinner' | 'both'
          deliveryDate: s.date || todayStr,
          date: s.date || todayStr,
          images: imagesList,
          stock: s.inStock !== false ? (s.stock || 100) : 0,
          isDailySpecial: true,
          slug: (s.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, ''),
          rating: s.rating || 4.8
        };
      });

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
            allProducts: [...formattedTodaysSpecials, ...formattedProducts], // Also make specials searchable/navigable as products
            todaysSpecials: formattedTodaysSpecials,
            megaCampaign: (megaCampaignDoc && megaCampaignDoc.isActive) ? megaCampaignDoc : null
        } 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
