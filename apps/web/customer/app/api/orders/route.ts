import { NextResponse } from 'next/server';
import { db, orders, orderItems, vendors, users, items as itemsTable, deliveryModes, pushSubscriptions, eq, desc, inArray } from '@lagchow/database';
import { or } from 'drizzle-orm';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { sendPushNotification } from '@lagchow/utils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function calculateConvenienceFee(subtotal: number): number {
  if (subtotal === 0) return 0;
  if (subtotal < 2000) return 100;
  if (subtotal < 5000) return 150;
  const rawFee = Math.round(subtotal * 0.05);
  return Math.min(500, rawFee);
}

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

    // Fetch all orders for this user
    const userOrders = await db.select({
      order: orders,
      vendor: vendors,
    })
    .from(orders)
    .leftJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

    if (userOrders.length === 0) {
      return NextResponse.json([]);
    }

    const orderIds = userOrders.map(row => row.order.id);
    const allOrderItems = await db.select({
      orderItem: orderItems,
      item: itemsTable,
    })
    .from(orderItems)
    .leftJoin(itemsTable, eq(orderItems.itemId, itemsTable.id))
    .where(inArray(orderItems.orderId, orderIds));

    // Group items by orderId
    const itemsByOrder = new Map<string, any[]>();
    for (const row of allOrderItems) {
      const oid = row.orderItem.orderId;
      if (!itemsByOrder.has(oid)) itemsByOrder.set(oid, []);
      itemsByOrder.get(oid)!.push({
        ...row.orderItem,
        item: row.item
      });
    }

    const formattedOrders = userOrders.map(row => ({
      ...row.order,
      vendor: row.vendor,
      items: itemsByOrder.get(row.order.id) || []
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to place an order.' }, { status: 401 });
    }

    const body = await request.json();
    const { vendorId: rawVendorId, items, deliveryFee, deliveryAddress, deliveryModeId, deliveryLat, deliveryLng, notes, paymentMethod } = body;

    if (!rawVendorId || !items || items.length === 0 || !deliveryAddress) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 });
    }

    // Resolve vendor by UUID or slug
    const vendorWhere = UUID_REGEX.test(String(rawVendorId))
      ? or(eq(vendors.id, String(rawVendorId)), eq(vendors.slug, String(rawVendorId)))
      : eq(vendors.slug, String(rawVendorId));
    const [vendorRecord] = await db.select().from(vendors).where(vendorWhere);

    if (!vendorRecord) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const resolvedVendorId = vendorRecord.id;
    const rawQueue = (vendorRecord.queueStatus && typeof vendorRecord.queueStatus === 'object')
      ? (vendorRecord.queueStatus as Record<string, any>)
      : {};
    const isPeakQueue =
      rawQueue.demand === 'High' ||
      rawQueue.demand === 'Very High' ||
      rawQueue.status === 'Rush Hour';

    const itemIds = items.map((item: { id: string }) => item.id);
    const dbItems = await db.select().from(itemsTable).where(inArray(itemsTable.id, itemIds));
    const dbItemMap = new Map(dbItems.map((dbItem) => [dbItem.id, dbItem]));

    let calculatedTotal = 0;
    let maxPrepMinutes = vendorRecord.preparationTime || 15;
    const validatedOrderItems: Array<{ itemId: string; quantity: number; priceAtTime: number }> = [];

    for (const item of items as Array<{ id: string; quantity: number }>) {
      const dbItem = dbItemMap.get(item.id);
      if (!dbItem || (!dbItem.isAvailable && !dbItem.restockTime)) {
        return NextResponse.json(
          { error: `Item ${dbItem?.name || item.id} is no longer available` },
          { status: 400 }
        );
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 });
      }
      calculatedTotal += dbItem.price * item.quantity;

      const itemPrep = isPeakQueue
        ? (dbItem.peakPreparationTime || (dbItem.preparationTime || 15) + 10)
        : (dbItem.preparationTime || 15);
      if (itemPrep > maxPrepMinutes) {
        maxPrepMinutes = itemPrep;
      }

      validatedOrderItems.push({
        itemId: dbItem.id,
        quantity: item.quantity,
        priceAtTime: dbItem.price,
      });
    }

    // Add extra queue buffer during Moderate or Rush Hour queue status
    const queueBufferMinutes =
      rawQueue.status === 'Rush Hour' ? 10 : rawQueue.status === 'Moderate' ? 5 : 0;
    const estimatedReadyTime = new Date(Date.now() + (maxPrepMinutes + queueBufferMinutes) * 60000);

    // Compute convenience fee & validate delivery fee server-side
    const verifiedConvenienceFee = calculateConvenienceFee(calculatedTotal);
    let verifiedDeliveryFee = Math.max(300, Number(deliveryFee) || 300);

    if (deliveryModeId) {
      const [mode] = await db
        .select()
        .from(deliveryModes)
        .where(eq(deliveryModes.id, deliveryModeId));
      if (mode) {
        verifiedDeliveryFee = Math.max(mode.baseFee, Number(deliveryFee) || mode.baseFee);
      }
    }

    // 1. Insert the parent Order
    const [newOrder] = await db.insert(orders).values({
      userId,
      vendorId: resolvedVendorId,
      deliveryModeId: deliveryModeId || null,
      status: 'pending',
      totalAmount: calculatedTotal,
      deliveryFee: verifiedDeliveryFee,
      convenienceFee: verifiedConvenienceFee,
      deliveryAddress,
      deliveryLat: deliveryLat || null,
      deliveryLng: deliveryLng || null,
      notes: notes || null,
      paymentMethod: paymentMethod || 'transfer',
      paymentStatus: 'pending',
      estimatedReadyTime,
      statusTimestamps: { pending: new Date().toISOString() }
    }).returning();

    // 2. Insert the Order Items
    const orderItemsToInsert = validatedOrderItems.map((item) => ({
      orderId: newOrder.id,
      itemId: item.itemId,
      quantity: item.quantity,
      priceAtTime: item.priceAtTime,
    }));

    await db.insert(orderItems).values(orderItemsToInsert);

    // 3. Trigger Push Notification to Vendor
    try {
      const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.vendorId, resolvedVendorId));
      if (subs.length > 0) {
        await Promise.all(subs.map((sub: any) =>
          sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            {
              title: 'New Order Received! 🔔',
              body: `Order #${newOrder.id.slice(0, 5).toUpperCase()} for ₦${calculatedTotal.toLocaleString()} is waiting for acceptance.`,
              url: '/'
            }
          ).catch(e => console.error("Vendor push failed:", e))
        ));
      }
    } catch (pushErr) {
      console.error("Failed to notify vendor:", pushErr);
    }

    // 4. Emit Realtime Event
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3010";
      await fetch(`${wsUrl}/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: "ORDER_CREATED",
          data: {
            eventId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            actorId: userId,
            actorType: "customer",
            data: {
              orderId: newOrder.id,
              vendorId: newOrder.vendorId,
              customerId: userId,
              totalAmount: newOrder.totalAmount,
              deliveryFee: newOrder.deliveryFee,
              deliveryAddress: newOrder.deliveryAddress,
              estimatedReadyTime: estimatedReadyTime.toISOString(),
            }
          }
        })
      });
    } catch (wsError) {
      console.error("Failed to emit realtime order created event:", wsError);
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
