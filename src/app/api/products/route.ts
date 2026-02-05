// src/app/api/products/route.ts

import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // প্যারামিটারগুলো নেওয়া
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12'); // একবারে ১২টা দেখাবে
    const category = searchParams.get('category') || 'All';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'recommended';
    const vegOnly = searchParams.get('vegOnly') === 'true';

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    // ১. কোয়েরি ফিল্টার তৈরি
    let query: any = {};

    if (category !== 'All') {
      // Veg বাদে অন্য ক্যাটাগরি হলে ডাইরেক্ট ম্যাচ
      if (category.toLowerCase() !== 'veg') {
         query.Category = { $regex: new RegExp(`^${category}$`, 'i') };
      }
    }

    if (search) {
      query.$or = [
        { Name: { $regex: search, $options: 'i' } },
        { Description: { $regex: search, $options: 'i' } }
      ];
    }

    // Veg Only ফিল্টার (ক্যাটাগরি বা নামের মধ্যে খুঁজবে)
    if (vegOnly || category.toLowerCase() === 'veg') {
      const vegRegex = /veg|paneer/i;
      query.$or = [
        ...(query.$or || []), // যদি সার্চ থাকে সেটা রাখবে
        { Category: { $regex: vegRegex } },
        { Name: { $regex: vegRegex } }
      ];
      // সার্চ কোয়েরি এবং ভেজ কোয়েরি কনফ্লিক্ট এড়াতে $and ব্যবহার করা ভালো, 
      // তবে সিম্পলিসিটির জন্য এখানে লজিক মার্চ করা হলো। 
      // ভেজ স্পেশাল লজিক:
      if(category.toLowerCase() === 'veg') {
          delete query.Category; // উপরের ক্যাটাগরি লজিক ওভাররাইড হবে
          query.$or = [
             { Category: { $regex: /veg|paneer/i } },
             { Name: { $regex: /veg|paneer/i } }
          ];
      }
    }

    // ২. সর্টিং লজিক
    let sortOptions: any = {};
    
    if (sort === 'price-low') {
      sortOptions = { Price: 1 };
    } else if (sort === 'price-high') {
      sortOptions = { Price: -1 };
    } else if (sort === 'rating') {
      sortOptions = { Rating: -1 }; // যদি ডাটাবেসে রেটিং থাকে
    } else {
      // Default: Recommended
      sortOptions = { 
        InStock: -1,       
        isDailySpecial: -1, 
        Name: 1            
      };
    }

    // ৩. ডাটা ফেচিং
    const skip = (page - 1) * limit;

    const menuItems = await db.collection('menuItems')
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();

    // টোটাল কাউন্ট (পেজিনেশনের জন্য)
    const total = await db.collection('menuItems').countDocuments(query);
    const hasMore = skip + menuItems.length < total;

    // ৪. ফরম্যাটিং
    const products = menuItems.map((doc) => ({
      id: doc._id.toString(),
      name: doc.Name || 'Unknown Dish',
      slug: (doc.Name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, ''),
      description: doc.Description || '',
      price: doc.Price || 0,
      category: { 
        id: (doc.Category || '').toLowerCase(), 
        name: doc.Category || 'Other' 
      },
      images: doc.ImageURLs?.map((url: string, index: number) => ({
        id: `img-${index}`,
        url: url,
        alt: doc.Name,
      })) || [],
      rating: 4.5,
      reviewCount: 0,
      stock: doc.InStock ? 100 : 0,
      featured: doc.Bestseller === true || doc.Bestseller === "true",
      isDailySpecial: doc.isDailySpecial === true, 
      reviews: [],
      createdAt: doc.CreatedAt ? new Date(doc.CreatedAt).toISOString() : undefined
    }));

    return NextResponse.json({ success: true, products, hasMore, total });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, products: [], hasMore: false }, { status: 500 });
  }
}