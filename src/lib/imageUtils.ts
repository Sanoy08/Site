// src/lib/imageUtils.ts

const PROXY_DOMAIN = 'https://images.bumbaskitchen.app';
const CLOUDINARY_DOMAIN = 'res.cloudinary.com';

export function optimizeImageUrl(url: string | undefined | null): string {
  // ১. যদি কোনো URL না থাকে, ডিফল্ট বা ফাঁকা স্ট্রিং ফেরত দিন
  if (!url) return '';

  // ২. যদি এটি ক্লাউডিনারির ইমেজ না হয়, তবে যা আছে তাই ফেরত দিন
  if (!url.includes(CLOUDINARY_DOMAIN)) return url;

  // ৩. ডোমেইন পরিবর্তন (Cloudinary -> Cloudflare Worker)
  let newUrl = url.replace(`https://${CLOUDINARY_DOMAIN}`, PROXY_DOMAIN);

  // ৪. অটোমেটিক অপটিমাইজেশন (যদি আগে থেকে সাইজ না দেওয়া থাকে)
  // এটি ইমেজের সাইজ কমাবে এবং স্পিড বাড়াবে
  if (!newUrl.includes('/w_') && !newUrl.includes('/q_')) {
    newUrl = newUrl.replace('/upload/', '/upload/w_500,q_auto,f_auto/');
  }

  return newUrl;
}