import { NextResponse } from 'next/server';
import { db } from '@lagchow/database';
import { pushSubscriptions } from '@lagchow/database/src/schema';
import { cookies } from 'next/headers';
import * as jwt from 'jose';

export async function POST(req: Request) {
  try {
    const subscription = await req.json();
    
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Attempt to identify user from session cookie
    let userId: string | null = null;
    const cookieStore = await cookies();
    const token = cookieStore.get('__session')?.value;
    
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
        const { payload } = await jwt.jwtVerify(token, secret);
        if (payload.sub) {
          userId = payload.sub as string;
        }
      } catch (e) {
        // Continue even if not authenticated, might just be anonymous subscription
        console.warn('Could not verify session for push subscription');
      }
    }

    // Insert or update subscription
    await db.insert(pushSubscriptions).values({
      userId: userId, // could be null
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
