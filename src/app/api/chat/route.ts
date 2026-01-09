// src/app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { clientPromise } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, userName } = body; // ★ userName রিসিভ করা

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    
    // ১. মেনু ডেটা
    const menuItems = await db.collection('menuItems').find({}, {
        projection: { _id: 1, Name: 1, Price: 1, InStock: 1, Slug: 1 } 
    }).toArray();

    const menuContext = menuItems.map(item => {
      const safeSlug = item.Slug || item.Name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      return `ID: ${item._id.toString()} | Name: ${item.Name} | Price: ₹${item.Price} | Slug: ${safeSlug} | Status: ${item.InStock ? 'Available' : 'Out of Stock'}`;
    }).join('\n');

    // ২. কুপন ডেটা
    const publicCoupons = await db.collection('coupons').find({
        isActive: true,
        userId: { $exists: false } 
    }).toArray();

    const couponContext = publicCoupons.map(c => 
        `- Code: ${c.code} | Get ${c.value}${c.discountType === 'percentage' ? '%' : '₹'} OFF | Min Order: ₹${c.minOrder}`
    ).join('\n');

    // ৩. অর্ডার ট্র্যাকিং
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

    // ৫. সিস্টেম প্রম্পট (User Name যুক্ত করা হয়েছে)
    const systemPrompt = `
      You are the AI assistant for "Bumba's Kitchen".
      
      👤 USER INFO: 
      You are talking to: ${userName || 'Guest'}. 
      If the name is available (not Guest), address them by name occasionally to be friendly.

      🥬 MENU:
      ${menuContext}

      💰 OFFERS:
      ${couponContext}

      ${orderContext}

      ⚡ RESPONSE JSON:
      {
        "reply": "Short answer. Use emojis.",
        "products": [{ "id": "...", "name": "...", "price": "...", "slug": "..." }]
      }

      RULES:
      1. Be friendly.
      2. If asking for suggestions, show products.
      3. Language: Banglish or English.
    `;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: `{"reply": "Understood! Hi ${userName || 'there'}!", "products": []}` }] },
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
    return NextResponse.json({ reply: "Server Busy. Try later.", products: [] }, { status: 200 });
  }
}