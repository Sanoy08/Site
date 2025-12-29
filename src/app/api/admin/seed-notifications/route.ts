// src/app/api/admin/seed-notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');

    // আগের সব প্রিসেট ডিলিট করে দিচ্ছি (Clean Slate)
    await db.collection('notificationPresets').deleteMany({});

    const presets = [
      // ============================================================
      // 1. LUNCH PRE-ORDER (Time: 00:00 AM / Midnight)
      // টার্গেট: যারা রাতে জেগে আছে, কালকের লাঞ্চ ফিক্স করতে চায়
      // ============================================================
      {
        title: "Kal Dupure Ki Khaben? 🤔",
        message: "Raat hoyeche, kintu kaler lunch ta ajkei fix kore rakhun! Nischinte ghuman. 🌙",
        image: "https://images.unsplash.com/photo-1544365561-3bd463b7569d?w=500&h=500&fit=crop",
        link: "/menus?category=thali",
        timeSlot: "lunch-preorder",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Sort Tomorrow's Lunch! 🍱",
        message: "Don't rush tomorrow morning. Pre-book your Fish Thali now and sleep tight.",
        image: "https://images.unsplash.com/photo-1626776426897-40c21303ba7d?w=500&h=500&fit=crop",
        link: "/menus?category=fish",
        timeSlot: "lunch-preorder",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Office Lunch Reminder 💼",
        message: "Busy day ahead? Secure your Chicken Biryani for tomorrow's lunch right now!",
        image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&h=500&fit=crop",
        link: "/menus?category=chicken",
        timeSlot: "lunch-preorder",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Midnight Cravings? 😋",
        message: "You might be hungry now, but make sure you eat well tomorrow! Pre-order Lunch.",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=500&fit=crop",
        link: "/menus",
        timeSlot: "lunch-preorder",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Skip the Queue ⏳",
        message: "Pre-order tonight to get priority delivery tomorrow afternoon.",
        image: "https://images.unsplash.com/photo-1606471191009-63994c53433b?w=500&h=500&fit=crop",
        link: "/menus",
        timeSlot: "lunch-preorder",
        isActive: true,
        createdAt: new Date()
      },

      // ============================================================
      // 2. LUNCH (Time: 06:00 AM)
      // টার্গেট: সকাল হয়েছে, আজকের লাঞ্চ অর্ডার করার রিমাইন্ডার
      // ============================================================
      {
        title: "Shuvo Sokal! ☀️",
        message: "Aj dupure ki ranna hobe? Chinta nei, Bumba's Kitchen ache! Order now. 🛵",
        image: "https://images.unsplash.com/photo-1525351484163-7529414395d8?w=500&h=500&fit=crop",
        link: "/menus",
        timeSlot: "lunch",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Macher Jhol & Bhat 🐟",
        message: "Authentic Bengali comfort food for lunch? Order before stock runs out!",
        image: "https://images.unsplash.com/photo-1606914501449-b73204610ba8?w=500&h=500&fit=crop",
        link: "/menus?category=fish",
        timeSlot: "lunch",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Veg Thali Special 🥦",
        message: "Start your afternoon with a wholesome Veg Thali. Fresh & Hot!",
        image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&h=500&fit=crop",
        link: "/menus?category=veg",
        timeSlot: "lunch",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Don't Skip Lunch! 🍲",
        message: "Fuel up for the day with our Special Chicken Curry & Rice.",
        image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&h=500&fit=crop",
        link: "/menus?category=chicken",
        timeSlot: "lunch",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Egg Curry Love 🥚",
        message: "Simple, tasty, and satisfying. Order Egg Curry for lunch today.",
        image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=500&h=500&fit=crop",
        link: "/menus?category=egg",
        timeSlot: "lunch",
        isActive: true,
        createdAt: new Date()
      },

      // ============================================================
      // 3. DINNER PRE-ORDER (Time: 12:00 PM / Noon)
      // টার্গেট: লাঞ্চের সময় রাতের প্ল্যান মনে করিয়ে দেওয়া
      // ============================================================
      {
        title: "Dinner Plan? 🥘",
        message: "Rater ranna niye tension? Pre-order your dinner now & relax!",
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&h=500&fit=crop",
        link: "/menus?category=paneer",
        timeSlot: "dinner-preorder",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Tonight's Special ✨",
        message: "How about Mutton Kosha tonight? Reserve your plate now!",
        image: "https://images.unsplash.com/photo-1544365561-3bd463b7569d?w=500&h=500&fit=crop",
        link: "/menus?category=mutton",
        timeSlot: "dinner-preorder",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Ruti or Paratha? 🥙",
        message: "Choose your dinner staples early. Freshly made Rotis & Tadka!",
        image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=500&h=500&fit=crop",
        link: "/menus?category=chapati",
        timeSlot: "dinner-preorder",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Family Dinner 👨‍👩‍👧‍👦",
        message: "Planning a feast tonight? Order in bulk now for timely delivery.",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=500&fit=crop",
        link: "/menus",
        timeSlot: "dinner-preorder",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Chinese Cravings? 🍜",
        message: "Thinking about Chowmein for dinner? Pre-book it!",
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&h=500&fit=crop",
        link: "/menus?category=chinese",
        timeSlot: "dinner-preorder",
        isActive: true,
        createdAt: new Date()
      },

      // ============================================================
      // 4. DINNER (Time: 06:00 PM)
      // টার্গেট: সন্ধ্যাবেলা, এখনই অর্ডার করার সময়
      // ============================================================
      {
        title: "Hungry? Dinner is Ready! 🍽️",
        message: "Hot Rotis & Paneer Butter Masala are just a click away.",
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&h=500&fit=crop",
        link: "/menus?category=paneer",
        timeSlot: "dinner",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Snack to Dinner 🌯",
        message: "Egg Roll or Moglai Paratha? Start your evening right!",
        image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&h=500&fit=crop",
        link: "/menus?category=fried",
        timeSlot: "dinner",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Comfort Food 🌙",
        message: "End your day with simple Chicken Curry and Rice. Order now.",
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&h=500&fit=crop",
        link: "/menus?category=chicken",
        timeSlot: "dinner",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Late Night Cravings? 🦉",
        message: "We are open for dinner orders! Grab your favorites.",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop",
        link: "/menus",
        timeSlot: "dinner",
        isActive: true,
        createdAt: new Date()
      },
      {
        title: "Tarka & Ruti 🥘",
        message: "The classic dinner combo is waiting for you. Fast delivery!",
        image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&h=500&fit=crop",
        link: "/menus?category=veg",
        timeSlot: "dinner",
        isActive: true,
        createdAt: new Date()
      }
    ];

    await db.collection('notificationPresets').insertMany(presets);

    return NextResponse.json({ success: true, message: `Successfully seeded ${presets.length} presets for 4 slots!` });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}