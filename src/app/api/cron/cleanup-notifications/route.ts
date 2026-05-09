// src/app/api/cron/cleanup-notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifyCron } from '@/lib/auth-utils'; // ★ হেল্পার ইমপোর্ট

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,       
    api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET, 
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // ১. সিকিউরিটি চেক
        if (!verifyCron(request)) {
            return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
        }

        // ২. মেইন লজিক
        const searchResult = await cloudinary.search
            .expression('folder:notifications AND created_at < 7d')
            .max_results(50)
            .execute();

        const resources = searchResult.resources;
        const publicIds = resources.map((res: any) => res.public_id);

        if (publicIds.length === 0) {
            return NextResponse.json({ success: true, message: 'No old images to delete.' });
        }

        await cloudinary.api.delete_resources(publicIds);

        return NextResponse.json({ 
            success: true, 
            message: `Deleted ${publicIds.length} old images.`,
            deleted: publicIds 
        });

    } catch (error: any) {
        console.error("Cleanup Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}