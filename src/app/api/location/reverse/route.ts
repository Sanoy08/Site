import { NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/location/geoapify';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
        return NextResponse.json({ address: "Custom Location Selected" }, { status: 400 });
    }

    try {
        const address = await reverseGeocode(parseFloat(lat), parseFloat(lon));
        return NextResponse.json({ address });
    } catch (error: any) {
        console.error("Geoapify Reverse Error:", error.message);
        return NextResponse.json({ address: "Custom Location Selected" });
    }
}