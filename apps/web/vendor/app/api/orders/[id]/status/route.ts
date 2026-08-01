import { NextResponse } from 'next/server';
import { db } from '@lagchow/database';
import { orders, pushSubscriptions } from '@lagchow/database/src/schema';
import { eq } from 'drizzle-orm';
import { sendPushNotification } from '@lagchow/utils';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, resolvedParams.id)
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // EDGE CASE 16: Idempotency (Network loss during acceptance)
    // If the order is already in the exact state the vendor is trying to set, just return it!
    if (existingOrder.status === status) {
      return NextResponse.json(existingOrder);
    }

    // EDGE CASE 12: Vendor accepts after timeout/cancelled
    // Ensure strict state transitions
    if (status === 'accepted' || status === 'rejected') {
      if (existingOrder.status !== 'pending') {
        return NextResponse.json({ error: `Cannot ${status} an order that is currently ${existingOrder.status}.` }, { status: 409 });
      }
    }

    const currentTimestamps = (existingOrder.statusTimestamps as any) || {};
    const updatedTimestamps = { ...currentTimestamps, [status]: new Date().toISOString() };

    const updates: any = { 
      status,
      statusTimestamps: updatedTimestamps
    };
    if (status === 'preparing' && body.preparationTime) {
      const estimatedTime = new Date();
      estimatedTime.setMinutes(estimatedTime.getMinutes() + body.preparationTime);
      updates.estimatedReadyTime = estimatedTime;
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, resolvedParams.id))
      .returning();

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Trigger Push Notification to Customer
    try {
      const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, updatedOrder.userId));
      if (subs.length > 0) {
        
        let title = 'Order Update';
        let body = `Your order status changed to ${status}.`;
        
        if (status === 'accepted') {
          title = 'Order Accepted! ✅';
          body = `The vendor has accepted your order and is preparing it.`;
        } else if (status === 'preparing') {
          title = 'Food is being prepared! 🍳';
          body = `Your order is currently being prepared.`;
        } else if (status === 'ready') {
          title = 'Food is Ready! 🍲';
          body = `Your order is ready and waiting for pickup/delivery!`;
        } else if (status === 'rejected') {
          title = 'Order Cancelled ❌';
          body = `Unfortunately, the vendor could not accept your order.`;
        }

        await Promise.all(subs.map(sub => 
          sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            { title, body, url: `/orders/${updatedOrder.id}` }
          ).catch(e => console.error("Push failed for sub:", e))
        ));
      }
    } catch (pushError) {
      console.error("Failed to send push notification:", pushError);
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
