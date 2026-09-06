import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon') || searchParams.get('lng');

    try {
        const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        let address = "Custom Location Selected";
        if (data.status === "OK" && data.results.length > 0) {
            address = data.results[0].formatted_address;
        }
        return NextResponse.json({ address });
    } catch (error) {
        return NextResponse.json({ address: "Custom Location Selected" });
    }
}
