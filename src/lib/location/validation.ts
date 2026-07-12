import { DELIVERY_RADIUS_KM, BASE_DELIVERY_FEE, FREE_DELIVERY_RADIUS_KM, FEE_PER_EXTRA_KM } from './constants';
import { calculateRoute } from './routing';
import { ValidationResponse } from './types';

export async function validateDelivery(lat: number, lon: number): Promise<ValidationResponse> {
    try {
        const route = await calculateRoute(lat, lon);
        
        if (route.distanceKm > DELIVERY_RADIUS_KM) {
            return {
                success: true,
                deliverable: false,
                distanceText: route.distanceText,
                deliveryFee: 0,
                distanceKm: route.distanceKm,
                message: `Outside ${DELIVERY_RADIUS_KM}km delivery range!`
            };
        }

        let fee = 0;
        if (route.distanceKm > FREE_DELIVERY_RADIUS_KM) {
            const extraKm = Math.ceil(route.distanceKm - FREE_DELIVERY_RADIUS_KM);
            fee = BASE_DELIVERY_FEE + (extraKm * FEE_PER_EXTRA_KM);
        }

        return {
            success: true,
            deliverable: true,
            distanceText: route.distanceText,
            deliveryFee: fee,
            distanceKm: route.distanceKm
        };
    } catch (error: any) {
        return {
            success: false,
            deliverable: false,
            distanceText: '',
            deliveryFee: 0,
            distanceKm: 0,
            message: error.message || 'Failed to validate delivery'
        };
    }
}
