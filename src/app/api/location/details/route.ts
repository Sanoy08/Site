// src/app/api/location/details/route.ts

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('place_id');
    const sessionToken = searchParams.get('sessionToken');

    if (!placeId) {
        return NextResponse.json({ success: false });
    }

    try {
        const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
        // Include sessionToken in URL for GET request
        const url = "https://places.googleapis.com/v1/places/${placeId}?fields=location&sessionToken=${sessionToken}";
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Goog-Api-Key': apiKey || '',
            }
        });
        
        const data = await response.json();

        if (data.location) {
            return NextResponse.json({
                success: true,
                location: {
                    lat: data.location.latitude,
                    lng: data.location.longitude
                }
            });
        }
        
        return NextResponse.json({ success: false });
    } catch (error) {
        console.error("Google Places API (New) Details Error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
