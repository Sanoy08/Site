import { NextResponse } from 'next/server';
import { calculateRoute } from '@/lib/location/routing';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
        return NextResponse.json({ success: false, error: "Missing lat/lng" }, { status: 400 });
    }

    try {
        const route = await calculateRoute(parseFloat(lat), parseFloat(lng));
        return NextResponse.json(route);
    } catch (error: any) {
        console.error("Geoapify Routing Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
