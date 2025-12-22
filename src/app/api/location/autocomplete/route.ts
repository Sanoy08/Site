import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  // ৩ অক্ষরের কম হলে সার্চ করার দরকার নেই
  if (!query || query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const apiKey = process.env.OLA_MAPS_API_KEY;

  // ১. সার্ভারে API Key আছে কিনা চেক করা হচ্ছে
  if (!apiKey) {
    console.error("❌ ERROR: OLA_MAPS_API_KEY is missing in environment variables!");
    // ক্র্যাশ না করে খালি লিস্ট রিটার্ন করবে
    return NextResponse.json({ suggestions: [] }); 
  }
  
  // ২. সিম্পল Random ID জেনারেটর (Crypto এর বদলে)
  const requestId = Math.random().toString(36).substring(7);

  const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query)}&api_key=${apiKey}`;

  try {
    const res = await fetch(url, {
        headers: {
            'X-Request-Id': requestId
        }
    });
    
    if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ Ola API Error (${res.status}): ${errorText}`);
        return NextResponse.json({ suggestions: [] });
    }

    const data = await res.json();

    const suggestions = data.predictions 
      ? data.predictions.map((p: any) => ({
          description: p.description,
          place_id: p.place_id,
          main_text: p.structured_formatting?.main_text || p.description,
          secondary_text: p.structured_formatting?.secondary_text || ''
        }))
      : [];

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("❌ Location Fetch Error:", error);
    // সার্ভার এরর হলেও অ্যাপ যেন ক্র্যাশ না করে
    return NextResponse.json({ suggestions: [] });
  }
}