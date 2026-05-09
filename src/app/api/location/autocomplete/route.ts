// src/app/api/location/autocomplete/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    if (!q) return NextResponse.json({ suggestions: [] });

    // Ensure this key is in your .env file
    const apiKey = process.env.GOOGLE_MAPS_API_KEY; 
    
    // API Call to Google Places Autocomplete (Restricted to India using components=country:in)
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&components=country:in&key=${apiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.status === 'OK') {
            const suggestions = data.predictions.map((p: any) => ({
                place_id: p.place_id,
                description: p.description,
                main_text: p.structured_formatting.main_text,
                secondary_text: p.structured_formatting.secondary_text
            }));
            return NextResponse.json({ suggestions });
        } else {
            return NextResponse.json({ suggestions: [] });
        }
    } catch (error) {
        return NextResponse.json({ suggestions: [] }, { status: 500 });
    }
}
