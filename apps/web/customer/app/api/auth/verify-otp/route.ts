import { NextResponse } from 'next/server';
import { db, verificationTokens, users, eq, and } from '@lagchow/database';
import { signToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    // Check token
    const tokenRecord = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, otp)
      )
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (new Date() > tokenRecord.expires) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Check if user exists
    let user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    let isNewUser = false;

    if (!user) {
      // Create user
      const [newUser] = await db.insert(users).values({
        email,
        isVerified: true,
      }).returning();
      user = newUser;
      isNewUser = true;
    } else if (!user.isVerified) {
      // Mark verified
      const [updatedUser] = await db.update(users)
        .set({ isVerified: true })
        .where(eq(users.id, user.id))
        .returning();
      user = updatedUser;
    }

    // Determine if they need to complete profile
    const needsProfileCompletion = !user.name || (user.isStudent && !user.hallOfResidence) || (!user.isStudent && !user.landmark);

    // Delete used token
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));

    // Sign JWT
    const jwtToken = await signToken({
      id: user.id,
      email: user.email,
    });

    // Set Cookie
    const cookieStore = await cookies();
    cookieStore.set('__session', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ 
      ok: true, 
      needsProfileCompletion 
    });

  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
