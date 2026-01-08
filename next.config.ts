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
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.bumbaskitchen.app' },
    ],
  },
  
  // ★★★ GOOGLE DRIVE DIRECT DOWNLOAD SETUP ★★★
  async redirects() {
    return [
      {
        source: '/download/android',
        // আপনার গুগল ড্রাইভের ডিরেক্ট লিংক
        destination: 'https://drive.google.com/uc?export=download&id=1gmrSRR20zll27zsIE-2K_wbKy8rGL1xU',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;