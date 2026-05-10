// src/app/api/location/distance/route.ts
import { NextResponse } from 'next/server';

// Your Kitchen/Store Location Coordinates (Latitude, Longitude)
// Example: Janai, Hooghly
const STORE_LAT = 22.71805437725246; // Replace with your exact Latitude
const STORE_LNG = 88.26018355434981; // Replace with your exact Longitude

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('destinationId');

    if (!placeId) {
        return NextResponse.json({ success: false, error: 'Missing destination' }, { status: 400 });
    }

    try {
        const apiKey = process.env.OLA_MAPS_API_KEY;

        // Step 1: Get Lat/Lng from Place ID using Ola Place Details API
        const placeDetailsUrl = `https://api.olamaps.io/places/v1/details?place_id=${placeId}&api_key=${apiKey}`;
        const placeRes = await fetch(placeDetailsUrl);
        const placeData = await placeRes.json();

        if (!placeData.result?.geometry?.location) {
             throw new Error("Could not find location coordinates");
        }

        const destLat = placeData.result.geometry.location.lat;
        const destLng = placeData.result.geometry.location.lng;

        // Step 2: Get Distance using Ola Routing API
        const routingUrl = `https://api.olamaps.io/routing/v1/directions?origin=${STORE_LAT},${STORE_LNG}&destination=${destLat},${destLng}&api_key=${apiKey}`;
        const routeRes = await fetch(routingUrl, { method: 'POST' }); // Routing API often requires POST
        const routeData = await routeRes.json();

        if (routeData.routes && routeData.routes.length > 0) {
            const distanceMeters = routeData.routes[0].legs[0].distance;
            const distanceKm = (distanceMeters / 1000).toFixed(1);
            
            return NextResponse.json({
                success: true,
                distanceValue: distanceMeters,
                distanceText: `${distanceKm} km`
            });
        } else {
             throw new Error("Could not calculate route");
        }

    } catch (error) {
        console.error("Ola Maps Distance Error:", error);
        return NextResponse.json({ success: false, error: 'Distance calculation failed' }, { status: 500 });
    }
}