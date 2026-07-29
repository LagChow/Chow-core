import { NextResponse } from 'next/server';
import { db, verificationTokens, admins, eq, and } from '@lagchow/database';
import { signToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();

    // Check token
    const tokenRecord = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, emailLower),
        eq(verificationTokens.token, otp)
      )
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (new Date() > tokenRecord.expires) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Check if user exists (they should, from send-otp logic)
    const user = await db.query.admins.findFirst({
      where: eq(admins.email, emailLower)
    });

    if (!user) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Delete used token
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, emailLower));

    // Sign JWT
    const jwtToken = await signToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Set Cookie
    const cookieStore = await cookies();
    cookieStore.set('__admin_session', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
