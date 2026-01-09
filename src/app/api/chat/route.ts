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
    
    // ডাটাবেস থেকে মেনু আনা
    const menuItems = await db.collection('menuItems').find({}, {
        projection: { _id: 1, Name: 1, Price: 1, InStock: 1, Slug: 1 } 
    }).toArray();

    // AI-এর পড়ার জন্য মেনু লিস্ট তৈরি
    const menuContext = menuItems.map(item => {
      const safeSlug = item.Slug || item.Name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      return `ID: ${item._id.toString()} | Name: ${item.Name} | Price: ₹${item.Price} | Slug: ${safeSlug} | Status: ${item.InStock ? 'Available' : 'Out of Stock'}`;
    }).join('\n');

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // ★★★ FIX: 'gemini-2.5-flash-lite' ব্যবহার করা হচ্ছে ★★★
    // ২০২৬ সালে এটি ফ্রি টায়ারের জন্য বেস্ট অপশন (High Limit)
    // যদি এটিও কাজ না করে, তবে 'gemini-2.0-flash' চেষ্টা করবেন।
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite", 
        generationConfig: {
            responseMimeType: "application/json" 
        }
    });

    const systemPrompt = `
      You are the AI assistant for "Bumba's Kitchen".
      
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
      1. If suggesting food, ALWAYS include the 'slug' in the product object.
      2. Keep answers short and friendly in Banglish or English.
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
    
    // যদি মডেলের কোটা শেষ হয়ে যায় বা অন্য সমস্যা হয়
    const errorMessage = error.message?.includes('429') 
        ? "আমি এখন একটু ব্যস্ত, দয়া করে কিছুক্ষণ পর চেষ্টা করুন। (Server Busy)" 
        : "দুঃখিত, এখন কানেক্ট করা যাচ্ছে না।";

    return NextResponse.json(
        { reply: errorMessage, products: [] }, 
        { status: 200 } // ক্র্যাশ এড়াতে 200 পাঠানো হচ্ছে
    );
  }
}