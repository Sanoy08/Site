export const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || '';

// Default Store Location (Janai)
export const STORE_LAT = process.env.STORE_LAT ? parseFloat(process.env.STORE_LAT) : 22.717958;
export const STORE_LNG = process.env.STORE_LNG ? parseFloat(process.env.STORE_LNG) : 88.260207;

// Default Delivery Radius (50km)
export const DELIVERY_RADIUS_KM = process.env.DELIVERY_RADIUS_KM ? parseFloat(process.env.DELIVERY_RADIUS_KM) : 50.0;

// Base Delivery Fee params
export const BASE_DELIVERY_FEE = 50;
export const FREE_DELIVERY_RADIUS_KM = 2.0;
export const FEE_PER_EXTRA_KM = 10;
