import { GEOAPIFY_API_KEY, STORE_LAT, STORE_LNG } from './constants';
import { RouteResponse } from './types';

export async function calculateRoute(lat: number, lon: number): Promise<RouteResponse> {
    if (!GEOAPIFY_API_KEY) throw new Error("Missing GEOAPIFY_API_KEY");

    // Geoapify Routing format: lat,lon|lat,lon
    const waypoints = `${STORE_LAT},${STORE_LNG}|${lat},${lon}`;
    const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Routing failed");
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
        const properties = data.features[0].properties;
        const distanceMeters = properties.distance;
        const durationSeconds = properties.time;
        
        const distanceKm = parseFloat((distanceMeters / 1000).toFixed(1));
        const durationMinutes = Math.ceil(durationSeconds / 60);
        
        return {
            success: true,
            distanceMeters,
            distanceKm,
            durationSeconds,
            durationMinutes,
            distanceText: `${distanceKm} km`,
            durationText: `${durationMinutes} mins`
        };
    }
    
    throw new Error("No route found");
}
