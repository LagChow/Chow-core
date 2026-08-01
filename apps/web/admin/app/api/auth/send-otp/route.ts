import { NextResponse } from 'next/server';
import { db } from '@lagchow/database';
import { admins, verificationTokens } from '@lagchow/database/src/schema';
import { eq } from 'drizzle-orm';
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

    const emailLower = email.toLowerCase();

    // Check if the admin exists
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, emailLower)
    });

    if (!adminUser) {
      // Check if the admins table is empty. If it is, this is the first login, make them super_admin.
      const allAdmins = await db.query.admins.findMany({ limit: 1 });
      if (allAdmins.length === 0) {
        await db.insert(admins).values({
          email: emailLower,
          name: email.split('@')[0], // placeholder name
          role: 'super_admin'
        });
      } else {
        // If not empty, and user doesn't exist, they are not invited.
        return NextResponse.json({ error: 'You are not authorized to access the admin panel.' }, { status: 403 });
      }
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert verification token
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, emailLower));
    
    await db.insert(verificationTokens).values({
      identifier: emailLower,
      token: otp,
      expires: expiresAt,
    });

    // Send email
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'LagChow Admin <noreply@verify.chowvest.com>',
        to: emailLower,
        subject: 'Your Admin Verification Code',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Admin Login 🍔</h2>
            <p>Your verification code is:</p>
            <h1 style="font-size: 40px; letter-spacing: 5px; color: #FFC107;">${otp}</h1>
            <p>This code expires in 10 minutes.</p>
          </div>
        `,
      });
    } else {
      console.log(`[DEV OTP for ${emailLower}]: ${otp}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
