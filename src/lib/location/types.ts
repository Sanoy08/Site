export interface LocationSuggestion {
    place_id: string;
    description: string;
    main_text: string;
    secondary_text: string;
    lat: number;
    lon: number;
}

export interface RouteResponse {
    success: boolean;
    distanceMeters: number;
    distanceKm: number;
    durationSeconds: number;
    durationMinutes: number;
    distanceText: string;
    durationText: string;
}

export interface ValidationResponse {
    success: boolean;
    deliverable: boolean;
    distanceText: string;
    deliveryFee: number;
    distanceKm: number;
    message?: string;
}
