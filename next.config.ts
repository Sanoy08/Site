// next.config.ts

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },  
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.bumbaskitchen.app' },
    ],
  },
  
  // ★★★ Security Headers (খুবই গুরুত্বপূর্ণ) ★★★
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY', // অন্য সাইট আপনার সাইটকে আইফ্রেমে লোড করতে পারবে না
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // ★★★ GOOGLE DRIVE DIRECT DOWNLOAD SETUP ★★★
  async redirects() {
    return [
      {
        source: '/download/android',
        destination: 'https://drive.google.com/uc?export=download&id=1gmrSRR20zll27zsIE-2K_wbKy8rGL1xU',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;