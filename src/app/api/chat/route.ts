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

    // ১. ডাটাবেস থেকে মেনু আনা (Slug সহ)
    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    
    // ★★★ Slug ফিল্ডটি আনা হচ্ছে ★★★
    const menuItems = await db.collection('menuItems').find({}, {
        projection: { _id: 1, Name: 1, Price: 1, InStock: 1, Slug: 1 } 
    }).toArray();

    // ২. AI-এর পড়ার জন্য মেনু লিস্ট তৈরি (Slug সহ)
    const menuContext = menuItems.map(item => {
      // যদি পুরনো প্রোডাক্টে Slug না থাকে, তবে নাম থেকে বানিয়ে নেওয়া হচ্ছে
      const safeSlug = item.Slug || item.Name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      return `ID: ${item._id.toString()} | Name: ${item.Name} | Price: ₹${item.Price} | Slug: ${safeSlug} | Status: ${item.InStock ? 'Available' : 'Out of Stock'}`;
    }).join('\n');

    // ৩. AI কনফিগারেশন
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        generationConfig: {
            responseMimeType: "application/json" 
        }
    });

    // ৪. সিস্টেম প্রম্পট (AI কে Slug দিতে বলা হচ্ছে)
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

    // ৫. চ্যাট শুরু
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
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}