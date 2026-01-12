// src/app/api/cron/cleanup-notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// ক্লাউডিনারি কনফিগারেশন (সার্ভার সাইড)
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,       // .env.local এ থাকতে হবে
    api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET, // .env.local এ থাকতে হবে
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // ১. সিকিউরিটি চেক (Security Check)
        const authHeader = request.headers.get('authorization');
        const { searchParams } = new URL(request.url);
        const queryKey = searchParams.get('key');

        const CRON_SECRET = process.env.CRON_SECRET;

        // যদি হেডার বা কুয়েরি প্যারামিটার না মেলে, তাহলে ব্লক করে দাও
        if (authHeader !== `Bearer ${CRON_SECRET}` && queryKey !== CRON_SECRET) {
            return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
        }

        // ২. মেইন লজিক শুরু (Main Logic)
        const searchResult = await cloudinary.search
            .expression('folder:notifications AND created_at < 7d')
            .max_results(50)
            .execute();

        const resources = searchResult.resources;
        const publicIds = resources.map((res: any) => res.public_id);

        if (publicIds.length === 0) {
            return NextResponse.json({ success: true, message: 'No old images to delete.' });
        }

        const deleteResult = await cloudinary.api.delete_resources(publicIds);

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