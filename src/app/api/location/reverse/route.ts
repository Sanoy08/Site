import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
            headers: { 'User-Agent': 'BumbasKitchenApp/1.0' }
        });
        const data = await res.json();
        return NextResponse.json({ address: data.display_name });
    } catch (error) {
        return NextResponse.json({ address: "Custom Location Selected" });
    }
}