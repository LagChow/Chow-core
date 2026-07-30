import { NextResponse } from 'next/server';
import { db, orders, orderItems, vendors, eq, desc } from '@lagchow/database';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

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

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
