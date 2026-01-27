import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const DB_NAME = 'bumbas_kitchen'; // আপনার ডাটাবেস নাম
const OTP_COLLECTION = 'otps';
const USERS_COLLECTION = 'users';

export async function generateAndSaveOTP(phone: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  // ১. ৬ ডিজিটের OTP জেনারেট
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // ৫ মিনিট মেয়াদ

  // ২. আগের কোনো OTP থাকলে ডিলিট করুন (Clean slate)
  await db.collection(OTP_COLLECTION).deleteMany({ phone });

  // ৩. নতুন OTP সেভ করুন
  await db.collection(OTP_COLLECTION).insertOne({
    phone,
    otp,
    expiry,
    createdAt: new Date(),
  });

  return otp;
}

export async function verifyOTP(phone: string, inputOtp: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const record = await db.collection(OTP_COLLECTION).findOne({ phone });

  if (!record) return { success: false, message: 'OTP expired or request new one.' };

  // মেয়াদ চেক
  if (new Date() > new Date(record.expiry)) {
    return { success: false, message: 'OTP has expired.' };
  }

  // OTP মিলছে কিনা
  if (record.otp !== inputOtp) {
    return { success: false, message: 'Invalid OTP.' };
  }

  // OTP ভেরিফাইড হলে ডিলিট করে দিন
  await db.collection(OTP_COLLECTION).deleteOne({ _id: record._id });

  return { success: true };
}

export async function findOrCreateUser(phone: string) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  let user = await db.collection(USERS_COLLECTION).findOne({ phone });

  if (!user) {
    // নতুন ইউজার তৈরি
    const newUser = {
      phone,
      role: 'user', // ডিফল্ট রোল
      createdAt: new Date(),
      updatedAt: new Date(),
      // পুরনো সিস্টেমের ফিল্ডগুলো ফাঁকা রাখা হলো যাতে এরর না খায়
      name: '', 
      email: '',
      addresses: [],
    };
    const result = await db.collection(USERS_COLLECTION).insertOne(newUser);
    user = await db.collection(USERS_COLLECTION).findOne({ _id: result.insertedId });
  }

  return user;
}