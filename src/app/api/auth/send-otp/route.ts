import { NextResponse } from 'next/server';
import { generateAndSaveOTP } from '@/lib/auth-service';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    // ভারতীয় নম্বর ভ্যালিডেশন (Simple Check)
    // ১০ ডিজিট হতে হবে
    if (!phone || phone.length !== 10 || isNaN(Number(phone))) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian phone number.' },
        { status: 400 }
      );
    }

    const formattedPhone = `+91${phone}`; // ফরম্যাট ঠিক রাখা

    // ১. OTP জেনারেট এবং ডাটাবেসে সেভ
    const otp = await generateAndSaveOTP(phone); // আমরা ১০ ডিজিট দিয়েই সেভ করব খোঁজার সুবিধার জন্য

    // ২. MacroDroid Webhook কল করা
    const webhookUrl = process.env.MACRODROID_WEBHOOK_URL;
    
    if (webhookUrl) {
      // MacroDroid কে প্যারামিটার পাঠানো
      const params = new URLSearchParams({
        number: formattedPhone, // এই নম্বরে SMS যাবে
        message: `Your Bumba's Kitchen OTP is ${otp}. Valid for 5 mins.`, // এই টেক্সট যাবে
      });

      await fetch(`${webhookUrl}?${params.toString()}`);
    } else {
      console.warn('MacroDroid URL not configured. OTP:', otp);
      // ডেভেলপমেন্টের জন্য কনসোলে OTP দেখা যাবে
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully!' });

  } catch (error) {
    console.error('Send OTP Error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP. Try again.' },
      { status: 500 }
    );
  }
}