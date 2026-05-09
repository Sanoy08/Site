// src/app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { clientPromise } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, userName } = body; // ফ্রন্টএন্ড থেকে ইউজার নেম আসছে

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    
    // ১. মেনু ডেটা আনা
    const menuItems = await db.collection('menuItems').find({}, {
        projection: { _id: 1, Name: 1, Price: 1, InStock: 1, Slug: 1 } 
    }).toArray();

    const menuContext = menuItems.map(item => {
      const safeSlug = item.Slug || item.Name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      return `ID: ${item._id.toString()} | Name: ${item.Name} | Price: ₹${item.Price} | Slug: ${safeSlug} | Status: ${item.InStock ? 'Available' : 'Out of Stock'}`;
    }).join('\n');

    // ২. পাবলিক কুপন আনা (লজিক আপডেট করা হয়েছে)
    // - isActive: true হতে হবে
    // - userId: থাকা যাবে না (মানে সবার জন্য)
    // - usageLimit: 1 এর সমান হওয়া যাবে না (মানে সিঙ্গেল ইউজ কুপন বাদ)
    const publicCoupons = await db.collection('coupons').find({
        isActive: true,
        userId: { $exists: false }, 
        usageLimit: { $ne: 1 } // ★★★ এই লাইনটি নতুন যোগ করা হয়েছে (1 হলে বাদ দেবে)
    }).toArray();

    const couponContext = publicCoupons.map(c => 
        `- Code: ${c.code} | Get ${c.value}${c.discountType === 'percentage' ? '%' : '₹'} OFF | Min Order: ₹${c.minOrder}`
    ).join('\n');

    // ৩. অর্ডার ট্র্যাকিং লজিক
    let orderContext = "";
    const orderMatch = message.match(/BK-[A-Z0-9]+/i);
    
    if (orderMatch) {
        const orderId = orderMatch[0].toUpperCase();
        const order = await db.collection('orders').findOne({ OrderNumber: orderId });
        
        if (order) {
            orderContext = `
            📦 ORDER INFO:
            - Order ID: ${order.OrderNumber}
            - Status: ${order.Status}
            - Total: ₹${order.FinalPrice}
            - Delivery Boy: ${order.DeliveryBoy ? order.DeliveryBoy.name : 'Not assigned'}
            `;
        } else {
            orderContext = `❌ Order ID ${orderId} not found.`;
        }
    }

    // ৪. AI কনফিগারেশন
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite", // অথবা gemini-1.5-flash
        generationConfig: { responseMimeType: "application/json" }
    });

    // ৫. সিস্টেম প্রম্পট
    const systemPrompt = `
      You are the AI assistant for "Bumba's Kitchen".
      
      👤 USER CONTEXT:
      User Name: ${userName || 'Guest'}. (Be friendly and use their name if available).

      🥬 MENU:
      ${menuContext}

      💰 OFFERS:
      ${couponContext}
      (Only suggest these coupons if user asks for offers.)

      ${orderContext}

      ⚡ RESPONSE FORMAT (JSON):
      {
        "reply": "Your answer here using Emojis.",
        "products": [
           { "id": "...", "name": "...", "price": "...", "slug": "..." }
        ]
      }

      RULES:
      1. Language: Banglish or English.
      2. If suggesting food, always fill 'products' array correctly with slug.
    `;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: `{"reply": "Hi ${userName || 'there'}! Ki lagbe?", "products": []}` }] },
        ...(history || []).map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }],
        }))
      ],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    let parsedResponse;
    try {
        parsedResponse = JSON.parse(responseText);
    } catch (e) {
        parsedResponse = { reply: responseText, products: [] };
    }

    return NextResponse.json(parsedResponse);

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ reply: "Ekhon server busy ache. Pore try korun.", products: [] }, { status: 200 });
  }
}