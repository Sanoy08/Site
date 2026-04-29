// src/app/api/admin/download-pdf/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const base64Data = formData.get('base64') as string;
        const filename = formData.get('filename') as string || 'Invoice.pdf';

        if (!base64Data) {
            return new NextResponse("No PDF data provided", { status: 400 });
        }

        // Base64 থেকে রিয়েল PDF ফাইলে কনভার্ট করা হচ্ছে
        const buffer = Buffer.from(base64Data, 'base64');

        // Headers সেট করা হচ্ছে যাতে ব্রাউজার/অ্যাপ সরাসরি ডাউনলোড ট্রিগার করে
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("PDF Download API Error:", error);
        return new NextResponse("Failed to download PDF", { status: 500 });
    }
}
