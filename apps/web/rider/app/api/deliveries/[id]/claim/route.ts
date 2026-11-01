import { NextResponse } from 'next/server';
import { db, orders, pushSubscriptions, eq } from '@lagchow/database';
import { sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { sendPushNotification } from '@lagchow/utils';

async function getRiderIdFromSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('__session')?.value;
  if (!sessionToken) return null;
  try {
    const decoded = await verifyToken(sessionToken);
    if (!decoded) return null;
    return decoded.riderId as string;
  } catch (e) {
    return null;
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const riderId = await getRiderIdFromSession();
    
    if (!riderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = resolvedParams.id;

    // 1. Atomic Capacity Check for Rider (Max 2 concurrent deliveries)
    const riderUpdateResult = await db.execute(sql`
      UPDATE riders 
      SET current_order_count = current_order_count + 1,
          updated_at = NOW()
      WHERE id = ${riderId} 
        AND current_order_count < 2 
        AND status IN ('online', 'active')
      RETURNING id, current_order_count
    `);

    if (riderUpdateResult.rows.length === 0) {
      return NextResponse.json({ 
        error: "Cannot claim order. You have either reached your maximum capacity (2 active deliveries) or your status is offline." 
      }, { status: 409 });
    }

    // 2. Atomic Order Claim (Optimistic Locking)
    const nowIso = new Date().toISOString();
    
    const orderUpdateResult = await db.execute(sql`
      UPDATE orders
      SET rider_id = ${riderId},
          candidate_rider_id = NULL,
          status = 'rider_accepted',
          dispatched_at = NOW(),
          updated_at = NOW(),
          status_timestamps = COALESCE(status_timestamps, '{}'::jsonb) || jsonb_build_object('rider_accepted', ${nowIso}::text)
      WHERE id = ${orderId}
        AND status IN ('accepted', 'preparing', 'ready')
        AND rider_id IS NULL
        AND (candidate_rider_id IS NULL OR candidate_rider_id = ${riderId})
      RETURNING *
    `);

    // 3. Rollback Rider Capacity if Order Claim Failed (Race Condition Lost)
    if (orderUpdateResult.rows.length === 0) {
      await db.execute(sql`
        UPDATE riders 
        SET current_order_count = GREATEST(0, current_order_count - 1),
            updated_at = NOW()
        WHERE id = ${riderId}
      `);

      return NextResponse.json({ 
        error: "This order was just claimed by another rider or is no longer available." 
      }, { status: 409 });
    }

    const claimedOrder = orderUpdateResult.rows[0] as any;

    // 4. Trigger Push Notification to Customer
    try {
      const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, claimedOrder.user_id));
      if (subs.length > 0) {
        const title = 'Rider Assigned! 🛵';
        const pushBody = `A rider has accepted your order and is heading to the vendor!`;

        await Promise.all(subs.map((sub: any) =>
          sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            { title, body: pushBody, url: `/orders/${claimedOrder.id}` }
          ).catch(e => console.error("Push failed for sub:", e))
        ));
      }
    } catch (pushError) {
      console.error("Failed to send push notification on claim:", pushError);
    }

    // 5. Emit Realtime Event
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3010";
      await fetch(`${wsUrl}/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: "ORDER_STATUS_CHANGED",
          data: {
            eventId: crypto.randomUUID(),
            timestamp: nowIso,
            actorId: riderId,
            actorType: "rider",
            data: {
              orderId: claimedOrder.id,
              status: 'rider_accepted',
              riderId: riderId
            }
          }
        })
      });
    } catch (wsError) {
      console.error("Failed to emit realtime claim event:", wsError);
    }

    return NextResponse.json(claimedOrder);
  } catch (error) {
    console.error("Error claiming delivery:", error);
    return NextResponse.json({ error: "Failed to claim delivery" }, { status: 500 });
  }
}
