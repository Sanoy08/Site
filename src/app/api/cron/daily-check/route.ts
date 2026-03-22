// src/app/api/cron/daily-check/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { sendNotificationToUser, sendNotificationToAdmins } from '@/lib/notification'; // ★ sendNotificationToAdmins যোগ করা হলো
import { verifyCron } from '@/lib/auth-utils'; 

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!verifyCron(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('BumbasKitchenDB');
    const usersCollection = db.collection('users');
    const ordersCollection = db.collection('orders');

    // আজকের তারিখ বের করা
    const today = new Date();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = today.getDate().toString().padStart(2, '0');
    const dateString = `-${currentMonth}-${currentDay}`; 

    // --- লজিক ১: কাস্টমারদের জন্মদিনের উইশ (আজকের) ---
    const birthdayUsers = await usersCollection.find({ dob: { $regex: dateString + '$' } }).toArray();
    for (const user of birthdayUsers) {
        await sendNotificationToUser(client, user._id.toString(), `Happy Birthday, ${user.name}! 🎂`, "Wishing you a delicious day! Treat yourself with a special meal from us.", "", '/menus');
    }

    // --- লজিক ২: কাস্টমারদের বিবাহবার্ষিকীর উইশ (আজকের) ---
    const anniversaryUsers = await usersCollection.find({ anniversary: { $regex: dateString + '$' } }).toArray();
    for (const user of anniversaryUsers) {
        await sendNotificationToUser(client, user._id.toString(), `Happy Anniversary, ${user.name}! 🎉`, "Celebrate your special day with a grand feast. Order now!", "", '/menus');
    }

    // --- লজিক ৩: অ্যাডমিনকে ১ সপ্তাহ (৭ দিন) আগের রিমাইন্ডার পাঠানো ---
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7); // আজ থেকে ৭ দিন পর
    const nwMonth = (nextWeek.getMonth() + 1).toString().padStart(2, '0');
    const nwDay = nextWeek.getDate().toString().padStart(2, '0');
    const nextWeekString = `-${nwMonth}-${nwDay}`;

    const upcomingBirthdays = await usersCollection.countDocuments({ dob: { $regex: nextWeekString + '$' } });
    const upcomingAnniversaries = await usersCollection.countDocuments({ anniversary: { $regex: nextWeekString + '$' } });
    const totalUpcoming = upcomingBirthdays + upcomingAnniversaries;

    if (totalUpcoming > 0) {
        // অ্যাডমিনদের কাছে নোটিফিকেশন পাঠানো হচ্ছে
        await sendNotificationToAdmins(
            client,
            "Upcoming Special Dates! 📅",
            `${totalUpcoming} customers have a birthday or anniversary exactly 1 week from today. Click to view!`,
            "https://admin.bumbaskitchen.app/special-dates/upcoming" // লিংকে ক্লিক করলে নতুন পেজে যাবে
        );
    }

    // --- লজিক ৪: ইনঅ্যাক্টিভ ইউজার (We Miss You) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const activeOrders = await ordersCollection.distinct("userId", { Timestamp: { $gte: thirtyDaysAgo } });
    const inactiveUsers = await usersCollection.find({ _id: { $nin: activeOrders }, role: 'customer' }).limit(5).toArray();

    for (const user of inactiveUsers) {
        await sendNotificationToUser(client, user._id.toString(), "We Miss You! 🥺", "It's been a while since we served you. Come back and check out what's new!", "", '/menus');
    }

    return NextResponse.json({ 
        success: true, 
        message: `Daily Check Done. Admin Notified for ${totalUpcoming} upcoming events. Birthdays: ${birthdayUsers.length}, Anniversaries: ${anniversaryUsers.length}` 
    });

  } catch (error: any) {
    console.error("Daily Check Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}