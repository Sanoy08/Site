import { NextResponse } from 'next/server';
import { autocompleteAddress } from '@/lib/location/geoapify';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
        return NextResponse.json({ suggestions: [] });
    }

    try {
        const suggestions = await autocompleteAddress(query);
        return NextResponse.json({ suggestions });
    } catch (error: any) {
        console.error("Geoapify Autocomplete Error:", error.message);
        return NextResponse.json({ suggestions: [] }, { status: 500 });
    }
}