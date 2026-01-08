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
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.bumbaskitchen.app',
      },
    ],
  },
  
  // ★★★ MAGIC REDIRECT SETUP ★★★
  // ভবিষ্যতে অ্যাপ আপডেট হলে শুধু এখানেই লিংকটা বদলে দেবেন, 
  // পুরো ওয়েবসাইটে অটোমেটিক নতুন ভার্সন ডাউনলোড হবে।
  async redirects() {
    return [
      {
        source: '/download/android', // ছোট লিংক
        destination: 'https://github.com/Sanoy08/Site/releases/download/v1.0.0/app-release.apk', // আসল ডাউনলোড লিংক
        permanent: false, // false রাখা ভালো, যাতে ব্রাউজার ক্যাশ না ধরে রাখে
      },
    ];
  },
};

export default nextConfig;