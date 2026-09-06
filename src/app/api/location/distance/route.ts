// src/app/api/location/distance/route.ts
import { NextResponse } from 'next/server';

// Your Store Location (Janai)
const STORE_LAT = 22.717958;
const STORE_LNG = 88.260207;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) return NextResponse.json({ success: false });

    try {
        const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
        const url = "https://maps.googleapis.com/maps/api/distancematrix/json?origins=${STORE_LAT},${STORE_LNG}&destinations=${lat},${lng}&key=${apiKey}";
        
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === "OK" && data.rows[0].elements[0].status === "OK") {
            const element = data.rows[0].elements[0];
            const distMeters = element.distance.value;
            const distText = element.distance.text;
            
            return NextResponse.json({ 
                success: true, 
                distanceValue: distMeters, 
                distanceText: distText
            });
        }
        return NextResponse.json({ success: false });
    } catch (error) {
        return NextResponse.json({ success: false });
    }
}
