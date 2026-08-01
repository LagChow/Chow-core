import { NextResponse } from 'next/server';
import { db, verificationTokens, eq } from '@lagchow/database';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert verification token
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
    
    await db.insert(verificationTokens).values({
      identifier: email,
      token: otp,
      expires: expiresAt,
    });

    // Send email
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'LagChow <noreply@verify.chowvest.com>', // Assuming domain is verified, or use onboarding@resend.dev
        to: email,
        subject: 'Your LagChow Verification Code',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to LagChow! 🍔</h2>
            <p>Your verification code is:</p>
            <h1 style="font-size: 40px; letter-spacing: 5px; color: #FFC107;">${otp}</h1>
            <p>This code expires in 10 minutes.</p>
          </div>
        `,
      });
    } else {
      // In dev without API key, just log it
      console.log(`[DEV OTP for ${email}]: ${otp}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
