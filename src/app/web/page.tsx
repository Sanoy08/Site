// src/app/web/page.tsx
'use client';

export default function WebPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
            <h1 className="text-3xl font-bold mb-4 text-primary">Welcome to Bumba's Kitchen</h1>
            <p className="text-muted-foreground text-lg">
                Please download our Android App or use a Desktop PC to access the full platform.
            </p>
            {/* Pore ekhane apnar App download button ba onnya design add kore niben */}
        </div>
    );
}