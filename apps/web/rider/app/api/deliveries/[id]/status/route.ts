import { NextResponse } from 'next/server';
import { db, orders, pushSubscriptions, eq, and } from '@lagchow/database';
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const riderId = await getRiderIdFromSession();
    if (!riderId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const existingOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, resolvedParams.id),
        eq(orders.riderId, riderId) // Must belong to this rider!
      )
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found or not assigned to you" }, { status: 404 });
    }

    const currentTimestamps = (existingOrder.statusTimestamps as any) || {};
    const updatedTimestamps = { ...currentTimestamps, [status]: new Date().toISOString() };

    const updates: any = { 
      status,
      statusTimestamps: updatedTimestamps,
      updatedAt: new Date()
    };

    const [updatedOrder] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, resolvedParams.id))
      .returning();

    // Trigger Push Notification to Customer
    try {
      const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, updatedOrder.userId));
      if (subs.length > 0) {
        
        let title = 'Delivery Update';
        let pushBody = `Your order status changed to ${status}.`;
        
        if (status === 'rider_at_vendor') {
          title = 'Rider at Vendor 🏪';
          pushBody = `Your rider has arrived at the vendor to pick up your order.`;
        } else if (status === 'out_for_delivery') {
          title = 'Out for Delivery! 🛵';
          pushBody = `Your rider is on the way with your order!`;
        } else if (status === 'arrived') {
          title = 'Rider has Arrived! 📍';
          pushBody = `Your rider is at your location. Please meet them!`;
        } else if (status === 'delivered') {
          title = 'Order Delivered 🎉';
          pushBody = `Enjoy your LagChow!`;
        }

        await Promise.all(subs.map(sub => 
          sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            { title, body: pushBody, url: `/orders/${updatedOrder.id}` }
          ).catch(e => console.error("Push failed for sub:", e))
        ));
      }
    } catch (pushError) {
      console.error("Failed to send push notification:", pushError);
    }

    // Emit Realtime Event
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3010";
      await fetch(`${wsUrl}/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: "ORDER_STATUS_CHANGED",
          data: {
            eventId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            actorId: riderId,
            actorType: "rider",
            data: {
              orderId: updatedOrder.id,
              status: updatedOrder.status,
            }
          }
        })
      });
    } catch (wsError) {
      console.error("Failed to emit realtime order event:", wsError);
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating delivery status:", error);
    return NextResponse.json({ error: "Failed to update delivery" }, { status: 500 });
  }
}
