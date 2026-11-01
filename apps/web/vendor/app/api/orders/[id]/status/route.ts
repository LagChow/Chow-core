import { NextResponse } from 'next/server';
import { db, orders, pushSubscriptions, eq } from '@lagchow/database';
import { sendPushNotification } from '@lagchow/utils';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

async function getVendorIdFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('__session')?.value;
  if (!token) return null;
  try {
    const decoded = await verifyToken(token);
    return (decoded?.vendorId as string) || null;
  } catch {
    return null;
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const vendorId = await getVendorIdFromSession();
    if (!vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await req.json();
    const { status, estimatedMinutes } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, resolvedParams.id)
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existingOrder.vendorId !== vendorId) {
      return NextResponse.json({ error: "Forbidden: Order belongs to another vendor" }, { status: 403 });
    }

    const currentTimestamps = (existingOrder.statusTimestamps as any) || {};
    const updatedTimestamps = { ...currentTimestamps, [status]: new Date().toISOString() };

    const updates: any = { 
      status,
      statusTimestamps: updatedTimestamps,
      updatedAt: new Date()
    };

    if (estimatedMinutes && status === 'accepted') {
      const readyTime = new Date(Date.now() + estimatedMinutes * 60000);
      updates.estimatedReadyTime = readyTime;
    }

    const [updatedOrder] = await db.update(orders).set(updates).where(eq(orders.id, resolvedParams.id)).returning();

    // Trigger Push Notification to Customer
    try {
      const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, updatedOrder.userId));
      if (subs.length > 0) {
        let title = 'Order Update';
        let pushBody = `Your order status changed to ${status}.`;
        
        if (status === 'accepted') {
          title = 'Order Accepted! 🎉';
          pushBody = `The vendor has accepted your order. Est. ready in ${estimatedMinutes || 15} mins.`;
        } else if (status === 'preparing') {
          title = 'Cooking in Progress 🍳';
          pushBody = `Your meal is currently being prepared!`;
        } else if (status === 'ready') {
          title = 'Order is Ready! 🛍️';
          pushBody = `Your order is packed and waiting for the rider to pick it up.`;
        } else if (status === 'cancelled') {
          title = 'Order Cancelled ❌';
          pushBody = `Unfortunately, your order was cancelled by the vendor.`;
        }

        await Promise.all(subs.map((sub: any) =>
          sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            { title, body: pushBody, url: `/orders/${updatedOrder.id}` }
          ).catch(e => console.error("Push failed for sub:", e))
        ));
      }
    } catch (pushError) {
      console.error("Failed to send push notification:", pushError);
    }

    // Broadcast status update via WebSocket server
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3010";
    try {
      await fetch(`${socketUrl}/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'ORDER_STATUS_CHANGED',
          data: {
            eventId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            actorId: existingOrder.vendorId,
            actorType: 'vendor',
            data: {
              orderId: updatedOrder.id,
              status: updatedOrder.status,
              vendorId: updatedOrder.vendorId,
              userId: updatedOrder.userId,
              riderId: updatedOrder.riderId,
              estimatedReadyTime: updatedOrder.estimatedReadyTime
            }
          }
        })
      });
    } catch (wsError) {
      console.error("Failed to emit socket event:", wsError);
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
