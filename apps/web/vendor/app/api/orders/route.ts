import { NextResponse } from 'next/server';
import { db, orders, orderItems, items, eq, desc, inArray } from '@lagchow/database';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ error: "Missing vendorId" }, { status: 400 });
    }

    const fetchedOrders = await db.select().from(orders)
      .where(eq(orders.vendorId, vendorId))
      .orderBy(desc(orders.createdAt));

    if (fetchedOrders.length === 0) {
      return NextResponse.json([]);
    }

    const orderIds = fetchedOrders.map(o => o.id);
    
    const allOrderItems = await db.select({
      orderId: orderItems.orderId,
      quantity: orderItems.quantity,
      price: orderItems.priceAtTime,
      name: items.name,
      id: items.id,
    })
    .from(orderItems)
    .leftJoin(items, eq(orderItems.itemId, items.id))
    .where(inArray(orderItems.orderId, orderIds));

    const result = fetchedOrders.map(o => ({
      ...o,
      items: allOrderItems.filter(item => item.orderId === o.id)
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
