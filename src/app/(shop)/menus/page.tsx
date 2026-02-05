// src/app/(shop)/menus/page.tsx

import { MenusClient } from './MenusClient';
import { clientPromise } from '@/lib/mongodb';
import { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

// সরাসরি ডাটাবেস থেকে প্রথম ১২টি আইটেম আনছি (Fast Initial Load এর জন্য)
async function getInitialProducts() {
  try {
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    
    const menuItems = await db.collection('menuItems')
      .find({})
      .sort({ InStock: -1, isDailySpecial: -1, Name: 1 })
      .limit(12) // ★ মাত্র ১২টা লোড হবে
      .toArray();

    return menuItems.map((doc) => ({
      id: doc._id.toString(),
      name: doc.Name || 'Unknown Dish',
      slug: (doc.Name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, ''),
      description: doc.Description || '',
      price: doc.Price || 0,
      category: { id: (doc.Category || '').toLowerCase(), name: doc.Category || 'Other' },
      images: doc.ImageURLs?.map((url: string, index: number) => ({
        id: `img-${index}`, url: url, alt: doc.Name,
      })) || [],
      rating: 4.5,
      reviewCount: 0,
      stock: doc.InStock ? 100 : 0,
      featured: doc.Bestseller === true,
      isDailySpecial: doc.isDailySpecial === true, 
      reviews: [],
    })) as Product[];

  } catch (error) {
    console.error("Error fetching initial menu data:", error);
    return [];
  }
}

export default async function MenusPage() {
  const initialProducts = await getInitialProducts();

  return (
    <div>
      <MenusClient initialProducts={initialProducts} />
    </div>
  );
}