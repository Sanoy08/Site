import { NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/location/geoapify';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    try {
        const results = await geocodeAddress(query);
        return NextResponse.json({ results });
    } catch (error: any) {
        console.error("Geoapify Geocode Error:", error.message);
        return NextResponse.json({ results: [] }, { status: 500 });
    }
}
