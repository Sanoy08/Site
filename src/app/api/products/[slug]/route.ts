// src/app/api/products/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { Product } from '@/lib/types';
import { ObjectId } from 'mongodb';

const DB_NAME = 'BumbasKitchenDB';

// Helper to convert name to slug
const createSlug = (name: string) => 
  (name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const resolvedParams = await params;
    const rawSlug = resolvedParams?.slug;

    if (!rawSlug) {
      return NextResponse.json({ success: false, error: 'Slug parameter is required' }, { status: 400 });
    }

    const slug = decodeURIComponent(rawSlug).toLowerCase().trim();
    const cleanS = createSlug(slug);

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Fetch all items from menuItems
    const allItems = await db.collection('menuItems').find({}).toArray();
    
    // Try to find matching item in menuItems
    let productDoc = allItems.find(item => {
      const itemSlug = createSlug(item.Name);
      const itemNameClean = (item.Name || '').toLowerCase().trim();
      const itemId = item._id.toString();
      return itemSlug === cleanS || itemSlug === slug || itemId === slug || itemNameClean === slug.replace(/-/g, ' ');
    });

    // If still not found, check todaysSpecials collection
    let specialDoc: any = null;
    if (!productDoc) {
      const specials = await db.collection('todaysSpecials').find({ active: { $ne: false } }).toArray();
      specialDoc = specials.find((s: any) => {
        const sSlug = createSlug(s.dishName || s.name);
        const sNameClean = (s.dishName || s.name || '').toLowerCase().trim();
        const sId = s._id.toString();
        const sDishId = s.dishId ? s.dishId.toString() : '';
        return sSlug === cleanS || sSlug === slug || sId === slug || sDishId === slug || sNameClean === slug.replace(/-/g, ' ');
      });

      if (specialDoc) {
        // Find master dish
        productDoc = allItems.find(item => 
          item._id.toString() === specialDoc.dishId?.toString() || 
          createSlug(item.Name) === createSlug(specialDoc.dishName || specialDoc.name)
        );
      }
    }

    if (!productDoc && !specialDoc) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const baseName = productDoc?.Name || specialDoc?.dishName || specialDoc?.name || 'Special Dish';
    const baseDesc = productDoc?.Description || specialDoc?.description || '';
    const basePrice = productDoc?.Price ?? specialDoc?.price ?? 0;
    const baseCat = productDoc?.Category || specialDoc?.category || 'Special';
    const baseImages = (productDoc?.ImageURLs && productDoc.ImageURLs.length > 0)
      ? productDoc.ImageURLs.map((url: string, i: number) => ({ id: `img-${i}`, url, alt: baseName }))
      : (specialDoc?.imageUrl ? [{ id: 'img-0', url: specialDoc.imageUrl, alt: baseName }] : []);

    // Format Product
    const product: any = {
      id: productDoc ? productDoc._id.toString() : specialDoc._id.toString(),
      name: baseName,
      slug: createSlug(baseName),
      description: baseDesc,
      price: basePrice,
      category: { id: baseCat.toLowerCase(), name: baseCat },
      images: baseImages,
      rating: productDoc?.rating || productDoc?.Rating || specialDoc?.rating || 4.8,
      reviewCount: 10,
      stock: (productDoc?.InStock !== false && specialDoc?.active !== false) ? 100 : 0,
      featured: productDoc?.Bestseller === true || productDoc?.Bestseller === "true",
      reviews: [],
      createdAt: productDoc?.CreatedAt || specialDoc?.createdAt,
      isDailySpecial: Boolean(specialDoc),
      mealType: specialDoc?.mealType || 'both',
      deliveryDate: specialDoc?.date || ''
    };

    // Related products (same category)
    const relatedDocs = allItems
        .filter(item => item.Category === baseCat && (productDoc ? item._id.toString() !== productDoc._id.toString() : true))
        .slice(0, 4);

    const relatedProducts: any[] = relatedDocs.map(item => ({
        id: item._id.toString(),
        name: item.Name,
        slug: createSlug(item.Name),
        description: item.Description || '',
        price: item.Price || 0,
        category: { id: (item.Category || 'other').toLowerCase(), name: item.Category || 'Other' },
        images: item.ImageURLs?.map((url: string, i: number) => ({ id: `img-${i}`, url, alt: item.Name })) || [],
        rating: item.rating || item.Rating || 4.5,
        reviewCount: 0,
        stock: item.InStock ? 100 : 0,
        featured: item.Bestseller === true || item.Bestseller === "true",
        reviews: []
    }));

    return NextResponse.json({ success: true, product, relatedProducts }, { status: 200 });

  } catch (error: any) {
    console.error('GET Product Slug Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
