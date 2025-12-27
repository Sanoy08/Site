// src/app/(shop)/menus/page.tsx

import { MenusClient } from './MenusClient';
import { clientPromise } from '@/lib/mongodb';
import { Product } from '@/lib/types';

// রিয়েল-টাইম আপডেটের জন্য ক্যাশিং বন্ধ
export const dynamic = 'force-dynamic';

async function getMenuData() {
  try {
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    
    // ★★★ আপডেটেড সর্টিং লজিক ★★★
    const menuItems = await db.collection('menuItems')
      .find({})
      .sort({ 
        InStock: -1,       // ১. স্টক থাকলে আগে, না থাকলে সবার শেষে
        isDailySpecial: -1, // ২. স্টকে থাকা আইটেমগুলোর মধ্যে 'Daily Special' সবার উপরে
        Name: 1            // ৩. বাকি সব A-Z অর্ডারে
      }) 
      .toArray();

    const products: Product[] = menuItems.map((doc) => ({
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
      // Daily Special ফিল্ড ম্যাপ করা হচ্ছে
      isDailySpecial: doc.isDailySpecial === true, 
      reviews: [],
      createdAt: doc.CreatedAt ? new Date(doc.CreatedAt).toISOString() : undefined
    }));

    return products;

  } catch (error) {
    console.error("Error fetching menu data:", error);
    return [];
  }
}

export default async function MenusPage() {
  const products = await getMenuData();

  return (
    <div>
      <MenusClient initialProducts={products} />
    </div>
  );
}