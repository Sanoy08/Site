// src/app/api/cron/cleanup-notifications/route.ts

import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// ক্লাউডিনারি কনফিগারেশন (সার্ভার সাইড)
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,       // .env.local এ থাকতে হবে
    api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET, // .env.local এ থাকতে হবে
});

export const dynamic = 'force-dynamic'; // ক্যাশিং বন্ধ করার জন্য

export async function GET(request: Request) {
    try {
        // ১. গত ৭ দিন আগের ডেট বের করা (আপনি চাইলে ৩০ দিনও দিতে পারেন)
        // expression: 'folder:notifications AND created_at < 7d'
        
        const searchResult = await cloudinary.search
            .expression('folder:notifications AND created_at < 7d') // ৭ দিনের পুরনো ইমেজ খুঁজবে
            .max_results(50) // একসাথে সর্বোচ্চ ৫০টা ডিলিট করবে (সেফটি)
            .execute();

        const resources = searchResult.resources;
        const publicIds = resources.map((res: any) => res.public_id);

        if (publicIds.length === 0) {
            return NextResponse.json({ success: true, message: 'No old images to delete.' });
        }

        // ২. ইমেজগুলো ডিলিট করা
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