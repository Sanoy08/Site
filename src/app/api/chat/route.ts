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
    
    // ★★★ ১. প্যারালাল ডাটা ফেচিং (মেনু, কুপন, এবং সেটিংস একসাথে) ★★★
    const [menuItems, activeCoupons, settings] = await Promise.all([
        // মেনু আইটেম
        db.collection('menuItems').find({}, {
            projection: { _id: 1, Name: 1, Price: 1, InStock: 1, Slug: 1 } 
        }).toArray(),
        
        // অ্যাক্টিভ কুপন
        db.collection('coupons').find({ isActive: true }).toArray(),
        
        // স্টোর সেটিংস (দোকান খোলা/বন্ধ)
        db.collection('settings').findOne({})
    ]);

    // মেনু কনটেক্সট তৈরি
    const menuContext = menuItems.map(item => {
      const safeSlug = item.Slug || item.Name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      return `ID: ${item._id.toString()} | Name: ${item.Name} | Price: ₹${item.Price} | Slug: ${safeSlug} | Status: ${item.InStock ? 'Available' : 'Out of Stock'}`;
    }).join('\n');

    // কুপন কনটেক্সট তৈরি
    const couponContext = activeCoupons.length > 0 
        ? activeCoupons.map(c => `- Code: ${c.code} (${c.discountAmount}% OFF) - ${c.description || ''}`).join('\n')
        : "No active coupons currently.";

    // স্টোর স্ট্যাটাস চেক
    const isStoreOpen = settings?.isStoreOpen ?? true; // ডিফল্ট true ধরা হলো যদি সেটিংস না থাকে

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // মডেল কনফিগারেশন
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite", 
        generationConfig: {
            responseMimeType: "application/json" 
        }
    });

    // ★★★ ২. আপডেটেড সিস্টেম প্রম্পট ★★★
    const systemPrompt = `
      You are the smart AI assistant for "Bumba's Kitchen".
      
      🏪 STORE STATUS: ${isStoreOpen ? "OPEN ✅" : "CLOSED ❌ (We are currently closed)"}
      
      💰 ACTIVE OFFERS:
      ${couponContext}

      🥬 CURRENT MENU DATA:
      ${menuContext}

      ⚡ RESPONSE FORMAT (JSON ONLY):
      {
        "reply": "Short answer here.",
        "products": [
           { 
             "id": "...", 
             "name": "Food Name", 
             "price": "Price", 
             "slug": "The EXACT slug from the menu data" 
           }
        ]
      }

      RULES:
      1. If the store is CLOSED, politely inform the user but allow them to browse the menu.
      2. If the user asks for price, mention the price AND if any coupon is applicable to save money.
      3. If suggesting food, ALWAYS include the 'slug' in the product object.
      4. Keep answers short, helpful, and friendly in Banglish or English.
    `;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: `{"reply": "Understood! I have the latest store data.", "products": []}` }] },
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
        ? "আমি এখন একটু ব্যস্ত, দয়া করে কিছুক্ষণ পর চেষ্টা করুন। (Server Busy)" 
        : "দুঃখিত, এখন কানেক্ট করা যাচ্ছে না।";

    return NextResponse.json(
        { reply: errorMessage, products: [] }, 
        { status: 200 }
    );
  }
}