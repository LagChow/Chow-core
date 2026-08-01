import { NextResponse } from 'next/server';
import { db } from '@lagchow/database';
import { pushSubscriptions } from '@lagchow/database/src/schema';
import { sendPushNotification } from '@lagchow/utils';
import { cookies } from 'next/headers';
import * as jwt from 'jose';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    let vendorId: string | null = null;
    const cookieStore = await cookies();
    const token = cookieStore.get('__session')?.value;
    
    if (token) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
      const { payload } = await jwt.jwtVerify(token, secret);
      vendorId = (payload.vendorId || payload.id) as string;
    }

    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user subscriptions
    const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.vendorId, vendorId));

    if (subs.length === 0) {
      return NextResponse.json({ error: 'No subscriptions found for user' }, { status: 404 });
    }

    // Send push to all devices
    const results = await Promise.all(subs.map(sub => 
      sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        { 
          title: 'Test Notification', 
          body: 'This is a test push notification from LagChow!', 
          url: '/orders'
        }
      )
    ));

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Error sending test push:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
