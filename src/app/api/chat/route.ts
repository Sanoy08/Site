// src/app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { clientPromise } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body;

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

    // ২. পাবলিক কুপন আনা (Private Coupon গোপন রাখা হচ্ছে)
    // লজিক: isActive = true এবং userId ফিল্ড নেই
    const publicCoupons = await db.collection('coupons').find({
        isActive: true,
        userId: { $exists: false } 
    }).toArray();

    const couponContext = publicCoupons.map(c => 
        `- Code: ${c.code} | Get ${c.value}${c.discountType === 'percentage' ? '%' : '₹'} OFF | Min Order: ₹${c.minOrder}`
    ).join('\n');

    // ৩. অর্ডার ট্র্যাকিং লজিক
    // ইউজার যদি মেসেজে "BK-..." আইডি দেয়, তাহলে অর্ডার স্ট্যাটাস চেক হবে
    let orderContext = "";
    const orderMatch = message.match(/BK-[A-Z0-9]+/i); // Regex to find Order ID
    
    if (orderMatch) {
        const orderId = orderMatch[0].toUpperCase();
        const order = await db.collection('orders').findOne({ OrderNumber: orderId });
        
        if (order) {
            orderContext = `
            📦 ORDER STATUS INFO:
            - Order ID: ${order.OrderNumber}
            - Status: ${order.Status}
            - Items: ${order.Items?.map((i: any) => i.name).join(', ')}
            - Total Price: ₹${order.FinalPrice}
            - Delivery Address: ${order.DeliveryAddress}
            (Tell this to the user politely)
            `;
        } else {
            orderContext = `❌ System Info: User asked for Order ID ${orderId}, but it was not found in the database.`;
        }
    }

    // ৪. AI কনফিগারেশন (gemini-2.5-flash-lite)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite", 
        generationConfig: {
            responseMimeType: "application/json" 
        }
    });

    // ৫. সিস্টেম প্রম্পট আপডেট
    const systemPrompt = `
      You are the AI assistant for "Bumba's Kitchen".
      
      🥬 MENU DATA:
      ${menuContext}

      💰 ACTIVE PUBLIC OFFERS:
      ${couponContext}
      (Only mention coupons if user asks about offers/price. Do NOT make up fake codes.)

      ${orderContext}

      ⚡ RESPONSE FORMAT (JSON ONLY):
      {
        "reply": "Short answer here using Emojis.",
        "products": [
           { 
             "id": "...", 
             "name": "Food Name", 
             "price": "Price",
             "slug": "Slug" 
           }
        ]
      }

      RULES:
      1. Always include 'slug' in product suggestions.
      2. If Order ID is found in context, tell the status clearly.
      3. Language: Banglish or English.
    `;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: `{"reply": "Understood!", "products": []}` }] },
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
    const errorMessage = error.message?.includes('429') 
        ? "Server Busy. Please wait a moment." 
        : "Connection Error.";

    return NextResponse.json({ reply: errorMessage, products: [] }, { status: 200 });
  }
}