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

    // ৩. ভার্সন না মিললে প্যারালাল ফেচিং (একসাথে সব ডেটা আনবে)
    // ★ FIX: Added sorting to menuItems just like the original products API
    const [heroSlides, sliderImages, offers, products] = await Promise.all([
        db.collection('heroSlides').find({}).sort({ order: 1 }).toArray(),
        db.collection('homeSliderImages').find({}).sort({ order: 1 }).toArray(),
        db.collection('offers').find({ active: true }).sort({ createdAt: -1 }).toArray(),
        db.collection('menuItems').find({}).sort({ InStock: -1, isDailySpecial: -1, Name: 1 }).toArray() 
    ]);

    // ★ FIX: Correctly generate SLUG from Name instead of using ID
    const formatProduct = (item: any) => ({
        id: item._id.toString(),
        name: item.Name || 'Unknown Dish',
        description: item.Description || '',
        price: item.Price || 0,
        category: { id: (item.Category || '').toLowerCase(), name: item.Category || 'Other' },
        images: item.ImageURLs?.map((url: string, i: number) => ({ id: `img-${i}`, url, alt: item.Name })) || [],
        stock: item.InStock ? 100 : 0,
        featured: item.Bestseller === "true" || item.Bestseller === true,
        isDailySpecial: item.isDailySpecial === true,
        slug: (item.Name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '') 
    });

    const formattedProducts = products.map(formatProduct);
    const bestsellers = formattedProducts.filter(p => p.featured);

    return NextResponse.json({ 
        upToDate: false, 
        version: currentDbVersion, 
        data: { 
            heroSlides: heroSlides.map(s => ({ id: s._id.toString(), imageUrl: s.imageUrl, clickUrl: s.clickUrl, order: s.order })), 
            sliderImages: sliderImages.map(s => ({ id: s._id.toString(), imageUrl: s.imageUrl, clickUrl: s.clickUrl, order: s.order })), 
            offers: offers.map(o => ({ id: o._id.toString(), title: o.title, description: o.description, price: o.price, imageUrl: o.imageUrl })), 
            bestsellers,
            allProducts: formattedProducts
        } 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}