import { GEOAPIFY_API_KEY, STORE_LAT, STORE_LNG } from './constants';
import { LocationSuggestion } from './types';

// Generic fetch wrapper with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
}

export async function autocompleteAddress(query: string): Promise<LocationSuggestion[]> {
    if (!GEOAPIFY_API_KEY) throw new Error("Missing GEOAPIFY_API_KEY");

    // Bias towards store location (50km radius around Janai)
    const filter = `circle:${STORE_LNG},${STORE_LAT},50000`;
    const bias = `proximity:${STORE_LNG},${STORE_LAT}`;
    
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=${filter}&bias=${bias}&limit=5&format=json&apiKey=${GEOAPIFY_API_KEY}`;
    
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error("Failed to fetch autocomplete");
    
    const data = await response.json();
    
    return data.results.map((item: any) => ({
        place_id: item.place_id,
        description: item.formatted,
        main_text: item.address_line1 || item.name || item.formatted.split(',')[0],
        secondary_text: item.address_line2 || item.formatted,
        lat: item.lat,
        lon: item.lon
    }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
    if (!GEOAPIFY_API_KEY) throw new Error("Missing GEOAPIFY_API_KEY");

    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${GEOAPIFY_API_KEY}`;
    
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error("Failed to reverse geocode");
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
        return data.results[0].formatted;
    }
    throw new Error("No address found");
}

export async function geocodeAddress(query: string) {
    if (!GEOAPIFY_API_KEY) throw new Error("Missing GEOAPIFY_API_KEY");

    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&format=json&apiKey=${GEOAPIFY_API_KEY}`;
    
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error("Failed to geocode");
    
    const data = await response.json();
    return data.results;
}
