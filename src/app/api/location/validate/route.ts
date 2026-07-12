import { NextResponse } from 'next/server';
import { validateDelivery } from '@/lib/location/validation';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
        return NextResponse.json({ success: false, error: "Missing lat/lng" }, { status: 400 });
    }

    try {
        const validation = await validateDelivery(parseFloat(lat), parseFloat(lng));
        return NextResponse.json(validation);
    } catch (error: any) {
        console.error("Delivery Validation Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
