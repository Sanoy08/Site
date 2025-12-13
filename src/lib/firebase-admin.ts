// src/lib/firebase-admin.ts
import 'server-only';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      // আপনার .env.local এ থাকা পাবলিক আইডিই এখানে ব্যবহার করা যাবে,
      // অথবা আপনি চাইলে আলাদা FIREBASE_PROJECT_ID ও রাখতে পারেন।
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// নতুন অথেনটিকেশন সিস্টেমের জন্য এটি প্রয়োজন
export const authAdmin = admin.auth();

// আপনার বর্তমান মোবাইল অ্যাপের নোটিফিকেশনের জন্য এটি আগের মতোই রাখা হলো
export const messaging = admin.messaging();