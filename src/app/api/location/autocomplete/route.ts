// src/app/api/location/autocomplete/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ suggestions: [] });
    }

    try {
        const apiKey = process.env.OLA_MAPS_API_KEY;
        // Ola Maps Autocomplete API Endpoint
        const olaUrl = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query)}&api_key=${apiKey}`;

        const response = await fetch(olaUrl);
        const data = await response.json();

        // Map Ola's response format to our frontend format
        const suggestions = data.predictions?.map((item: any) => ({
            place_id: item.place_id,
            description: item.description,
            main_text: item.structured_formatting?.main_text || item.description,
            secondary_text: item.structured_formatting?.secondary_text || ''
        })) || [];

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error("Ola Maps Autocomplete Error:", error);
        return NextResponse.json({ suggestions: [] }, { status: 500 });
    }
}