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
        // OSRM format is lon,lat
        const url = `https://router.project-osrm.org/route/v1/driving/${STORE_LNG},${STORE_LAT};${lng},${lat}?overview=false`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const distMeters = data.routes[0].distance;
            const distKm = (distMeters / 1000).toFixed(1);
            return NextResponse.json({ 
                success: true, 
                distanceValue: distMeters, 
                distanceText: `${distKm} km` 
            });
        }
        return NextResponse.json({ success: false });
    } catch (error) {
        return NextResponse.json({ success: false });
    }
}