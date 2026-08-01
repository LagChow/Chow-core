import { NextResponse } from 'next/server';
import { db, verificationTokens, vendors, eq } from '@lagchow/database';
import { Resend } from 'resend';
import { cookies } from 'next/headers';
import { signToken } from '@/lib/jwt';

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, otp } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (action === 'send') {
      // Check if vendor exists
      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.email, email)
      });

      if (!vendor) {
        return NextResponse.json({ error: 'Vendor account not found for this email.' }, { status: 404 });
      }

      const generatedOtp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Upsert verification token
      await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
      
      await db.insert(verificationTokens).values({
        identifier: email,
        token: generatedOtp,
        expires: expiresAt,
      });

      // Send email
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'LagChow <noreply@verify.chowvest.com>',
          to: email,
          subject: 'Your LagChow Vendor Verification Code',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to the LagChow Merchant Portal! 🏪</h2>
              <p>Your vendor verification code is:</p>
              <h1 style="font-size: 40px; letter-spacing: 5px; color: #FFC107;">${generatedOtp}</h1>
              <p>This code expires in 10 minutes.</p>
            </div>
          `,
        });
        console.log(`[Resend] Sent OTP to ${email}`);
      } else {
        // In dev without API key, log it instead of failing
        console.log(`[DEV OTP for ${email}]: ${generatedOtp}`);
      }
      
      return NextResponse.json({ success: true, message: 'OTP sent successfully.' });
    }

    if (action === 'verify') {
      if (!otp) {
        return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
      }

      // Check the DB for the OTP
      const tokenRecord = await db.query.verificationTokens.findFirst({
        where: eq(verificationTokens.identifier, email),
      });

      if (!tokenRecord) {
        return NextResponse.json({ error: 'No OTP requested for this email.' }, { status: 400 });
      }

      if (tokenRecord.token !== otp) {
        return NextResponse.json({ error: 'Invalid OTP code.' }, { status: 400 });
      }

      if (new Date() > tokenRecord.expires) {
        return NextResponse.json({ error: 'OTP has expired.' }, { status: 400 });
      }

      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.email, email)
      });

      if (!vendor) {
        return NextResponse.json({ error: 'Vendor account not found.' }, { status: 404 });
      }

      // If this is their first login, update status to active
      if (vendor.status === 'pending_first_login') {
        await db.update(vendors)
          .set({ status: 'active' })
          .where(eq(vendors.id, vendor.id));
      }

      // Delete the used token
      await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));

      // Generate JWT for the vendor
      const token = await signToken({
        id: vendor.id,
        vendorId: vendor.id,
        email: vendor.email,
        role: 'vendor'
      });

      // Set HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set('__session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      // Return vendorId
      return NextResponse.json({ success: true, vendorId: vendor.id });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });

  } catch (error) {
    console.error('OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
