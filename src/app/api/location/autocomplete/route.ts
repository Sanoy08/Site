import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const apiKey = process.env.OLA_MAPS_API_KEY;
  
  // Ola Maps Autocomplete API Endpoint
  const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query)}&api_key=${apiKey}`;

  try {
    const res = await fetch(url, {
        headers: {
            'X-Request-Id': crypto.randomUUID() // Ola majhe majhe request ID chay
        }
    });
    
    if (!res.ok) {
        throw new Error(`Ola API Error: ${res.statusText}`);
    }

    const data = await res.json();

    // Data ta simple format e return korchi frontend er jonno
    const suggestions = data.predictions 
      ? data.predictions.map((p: any) => ({
          description: p.description,
          place_id: p.place_id,
          // Structured text thakle city/state alada kora jay
          main_text: p.structured_formatting?.main_text || p.description,
          secondary_text: p.structured_formatting?.secondary_text || ''
        }))
      : [];

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Location Fetch Error:", error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}