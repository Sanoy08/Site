import { NextResponse } from 'next/server';
import { verifyOTP, findOrCreateUser } from '@/lib/auth-service';
import { SignJWT } from 'jose';

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();

    // ১. OTP চেক
    const verification = await verifyOTP(phone, otp);
    if (!verification.success) {
      return NextResponse.json({ error: verification.message }, { status: 400 });
    }

    // ২. ইউজার খোঁজা বা তৈরি করা
    const user = await findOrCreateUser(phone);

    // ৩. JWT টোকেন তৈরি (Using jose)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ 
      userId: user._id.toString(), 
      role: user.role || 'user',
      phone: user.phone 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d') // ৩০ দিন লগইন থাকবে
      .sign(secret);

    // ৪. কুকি সেট করা
    const response = NextResponse.json({ 
      success: true, 
      user: { 
        id: user._id, 
        phone: user.phone, 
        role: user.role,
        name: user.name 
      } 
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // ৩০ দিন
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
  }
}