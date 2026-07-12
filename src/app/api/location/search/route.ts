import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    if (!q) return NextResponse.json({ suggestions: [] });

    try {
        // Hooghly area ke priority dewar jonno viewbox add kora hoyeche
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=in&viewbox=88.0,23.0,88.5,22.5&bounded=1`, {
            headers: { 'User-Agent': 'BumbasKitchenApp/1.0' }
        });
        const data = await res.json();
        
        const suggestions = data.map((item: any) => ({
            place_id: item.place_id,
            description: item.display_name,
            lat: item.lat,
            lon: item.lon,
            main_text: item.name || item.display_name.split(',')[0],
            secondary_text: item.display_name
        }));

        return NextResponse.json({ suggestions });
    } catch (error) {
        return NextResponse.json({ suggestions: [] }, { status: 500 });
    }
}