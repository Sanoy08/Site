import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const sessionToken = searchParams.get('sessionToken');

    if (!query) {
        return NextResponse.json({ suggestions: [] });
    }

    try {
        const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
        const url = "https://places.googleapis.com/v1/places:autocomplete";
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey || '',
            },
            body: JSON.stringify({
                input: query,
                sessionToken: sessionToken || undefined
            })
        });
        
        const data = await response.json();

        const suggestions = data.suggestions?.map((item: any) => ({
            place_id: item.placePrediction.placeId,
            description: item.placePrediction.text.text,
            main_text: item.placePrediction.structuredFormat?.mainText?.text || item.placePrediction.text.text,
            secondary_text: item.placePrediction.structuredFormat?.secondaryText?.text || ''
        })) || [];

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error("Google Places API (New) Autocomplete Error:", error);
        return NextResponse.json({ suggestions: [] }, { status: 500 });
    }
}
