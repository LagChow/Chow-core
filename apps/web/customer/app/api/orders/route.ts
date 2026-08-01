import { NextResponse } from 'next/server';
import { db } from "@lagchow/database";
import { orders, orderItems, pushSubscriptions, vendors, items as itemsTable } from "@lagchow/database/src/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { sendPushNotification } from "@lagchow/utils";

async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('__session')?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    if (!payload?.email) return null;
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, payload.email as string)
    });
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userOrdersRaw = await db.select({
      order: orders,
      vendor: vendors,
    })
    .from(orders)
    .leftJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

    const userOrders = userOrdersRaw.map(row => ({
      ...row.order,
      vendor: row.vendor
    }));

    return NextResponse.json(userOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vendorId, items, deliveryModeId, totalAmount, deliveryFee, convenienceFee, deliveryAddress, notes, paymentMethod } = body;

    if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    // Edge Case 17: Validate item prices and availability
    const itemIds = items.map((item: any) => item.id || item.itemId);
    const dbItems = await db.query.items.findMany({
      where: inArray(itemsTable.id, itemIds)
    });

    let calculatedTotal = 0;
    for (const clientItem of items) {
      const dbItem = dbItems.find(i => i.id === (clientItem.id || clientItem.itemId));
      if (!dbItem) {
        return NextResponse.json({ error: `Item ${clientItem.name} no longer exists.` }, { status: 400 });
      }
      if (!dbItem.isAvailable) {
        return NextResponse.json({ error: `Item ${dbItem.name} is currently out of stock!` }, { status: 400 });
      }
      if (dbItem.price !== clientItem.price) {
        return NextResponse.json({ error: `Price changed for ${dbItem.name}. Please review your cart.`, newPrice: dbItem.price }, { status: 409 });
      }
      calculatedTotal += dbItem.price * clientItem.quantity;
    }

    if (calculatedTotal !== totalAmount) {
      return NextResponse.json({ error: "Total amount mismatch." }, { status: 400 });
    }

    // Lookup the vendor's UUID from the database using the provided slug (vendorId from frontend)
    const dbVendor = await db.query.vendors.findFirst({
      where: (v, { eq }) => eq(v.slug, vendorId)
    });

    if (!dbVendor) {
      return NextResponse.json({ error: "Vendor not found in database" }, { status: 404 });
    }

    // 1. Create Order using the actual UUID
    const [order] = await db.insert(orders).values({
      userId,
      vendorId: dbVendor.id,
      deliveryModeId: deliveryModeId || null,
      totalAmount,
      deliveryFee,
      convenienceFee,
      deliveryAddress,
      notes,
      paymentMethod: paymentMethod || 'transfer',
      status: 'pending',
      paymentStatus: 'pending',
    }).returning();

    // 2. Insert Order Items
    const orderItemsToInsert = items.map((item: any) => ({
      orderId: order.id,
      itemId: item.id || item.itemId,
      quantity: item.quantity,
      priceAtTime: item.price,
    }));

    await db.insert(orderItems).values(orderItemsToInsert);

    const newOrder = order;

    // 3. Emit NEW_ORDER realtime event to the Socket Server
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3010";
      await fetch(`${wsUrl}/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: "NEW_ORDER",
          data: {
            eventId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            actorId: userId,
            actorType: "customer",
            data: {
              orderId: order.id,
              vendorId: dbVendor.id,
              status: order.status,
              totalAmount: order.totalAmount
            }
          }
        })
      });
    } catch (wsError) {
      console.error("Failed to emit realtime order event:", wsError);
      // We don't fail the order if the websocket notification fails
    }

    // 4. Send Web Push Notification to Vendor
    try {
      const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.vendorId, dbVendor.id));
      if (subs.length > 0) {
        await Promise.all(subs.map(sub => 
          sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            { 
              title: 'New Order Received! 🛵', 
              body: `You have a new order for ₦${order.totalAmount.toLocaleString()}`, 
              url: `/orders`
            }
          ).catch(e => console.error("Push failed for sub:", e))
        ));
      }
    } catch (pushError) {
      console.error("Failed to send push notification:", pushError);
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
