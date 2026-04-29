// src/app/api/location/distance/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const destinationId = searchParams.get('destinationId');
    
    if (!destinationId) return NextResponse.json({ success: false, error: 'Destination required' });

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    // Apnar store er exact location. "Janai, Garbagan" ba latitude,longitude dite paren.
    // Example lat/lng (Best for accurate 2km check): "22.7093,88.2570" 
    const originAddress = "Janai, Hooghly, West Bengal, India"; 
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originAddress)}&destinations=place_id:${destinationId}&key=${apiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
            const element = data.rows[0].elements[0];
            return NextResponse.json({
                success: true,
                distanceText: element.distance.text,     // e.g., "4.5 km"
                distanceValue: element.distance.value,   // e.g., 4500 (in meters)
                durationText: element.duration.text
            });
        } else {
            return NextResponse.json({ success: false, error: 'Could not calculate distance' });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: 'API Error' });
    }
}
