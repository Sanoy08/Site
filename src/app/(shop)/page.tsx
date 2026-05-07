// src/app/(shop)/page.tsx

import { HomeClient } from '@/components/shop/HomeClient';
import { clientPromise } from '@/lib/mongodb';
import { Product } from '@/lib/types';

// ★ বেস্ট প্র্যাকটিস: 'force-dynamic' সরিয়ে ISR ব্যবহার করা হলো
// এটি পেজটিকে ক্যাশ করবে এবং প্রতি 60 সেকেন্ডে ব্যাকগ্রাউন্ডে ডেটা আপডেট করবে।
export const revalidate = 60; 

async function getHomePageData() {
  try {
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    // ★ Projection ব্যবহার করা হলো: পুরো ডকুমেন্ট না এনে শুধু যে ফিল্ডগুলো দরকার সেগুলো আনা হচ্ছে
    // এতে মেমরি কম খরচ হবে এবং ডেটা ফাস্ট লোড হবে।
    const [slidesData, offersData, productsData, sliderImagesData] = await Promise.all([
      db.collection('heroSlides').find({}).sort({ order: 1 }).toArray(),
      db.collection('offers').find({ active: true }).toArray(),
      db.collection('menuItems').find({}).project({ 
        Name: 1, Description: 1, Price: 1, Category: 1, 
        ImageURLs: 1, InStock: 1, Bestseller: 1, isDailySpecial: 1, CreatedAt: 1 
      }).toArray(),
      db.collection('homeSliderImages').find({}).sort({ order: 1 }).toArray()
    ]);

    // স্লাইডার ম্যাপ
    const heroSlides = slidesData.map(slide => ({
      id: slide._id.toString(),
      imageUrl: slide.imageUrl,
      clickUrl: slide.clickUrl,
    }));

    // মিডল স্লাইডার ম্যাপ
    const sliderImages = sliderImagesData.map(slide => ({
      id: slide._id.toString(),
      imageUrl: slide.imageUrl,
      clickUrl: slide.clickUrl,
    }));

    // অফার ম্যাপ
    const offers = offersData.map(offer => ({
      id: offer._id.toString(),
      title: offer.title,
      description: offer.description,
      price: offer.price,
      imageUrl: offer.imageUrl,
    }));

    // সব প্রোডাক্ট ম্যাপ
    const allProducts = productsData.map(item => ({
      id: item._id.toString(),
      name: item.Name,
      slug: item.Name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, ''),
      description: item.Description || '',
      price: item.Price,
      category: { id: item.Category?.toLowerCase(), name: item.Category },
      images: item.ImageURLs?.map((url: string, i: number) => ({ id: `img-${i}`, url, alt: item.Name })) || [],
      rating: 4.5,
      reviewCount: 0,
      stock: item.InStock ? 100 : 0,
      featured: item.Bestseller === true || item.Bestseller === "true",
      isDailySpecial: item.isDailySpecial === true, 
      createdAt: item.CreatedAt ? new Date(item.CreatedAt).toISOString() : undefined
    }));

    const bestsellers = allProducts.filter((p: any) => p.featured).slice(0, 8);

    return { heroSlides, offers, bestsellers, allProducts, sliderImages };

  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return { heroSlides: [], offers: [], bestsellers: [], allProducts: [], sliderImages: [] };
  }
}

export default async function HomePage() {
  const data = await getHomePageData();

  return (
    <HomeClient 
      heroSlides={data.heroSlides} 
      sliderImages={data.sliderImages}
      offers={data.offers} 
      bestsellers={data.bestsellers as Product[]} 
      allProducts={data.allProducts as Product[]} 
    />
  );
}