import { NextResponse } from 'next/server';
import { db, orders, orderItems, vendors, items, eq } from '@lagchow/database';
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the order
    const orderRows = await db.select({
      order: orders,
      vendor: vendors,
    })
    .from(orders)
    .leftJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(eq(orders.id, id));

    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderRow = orderRows[0];
    if (orderRow.order.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch order items with item details
    const orderItemsRaw = await db.select({
      orderItem: orderItems,
      item: items,
    })
    .from(orderItems)
    .leftJoin(items, eq(orderItems.itemId, items.id))
    .where(eq(orderItems.orderId, id));

    const formattedOrderItems = orderItemsRaw.map(row => ({
      ...row.orderItem,
      item: row.item
    }));

    const formattedOrder = {
      ...orderRow.order,
      vendor: orderRow.vendor,
      items: formattedOrderItems
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    if (body.action === 'cancel') {
      const existingOrder = await db.query.orders.findFirst({
        where: eq(orders.id, id)
      });

      if (!existingOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      if (existingOrder.userId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Edge Case 4: Customer cancels immediately
      if (existingOrder.status !== 'pending') {
        return NextResponse.json({ error: `Cannot cancel an order that is currently ${existingOrder.status}.` }, { status: 409 });
      }

      const currentTimestamps = (existingOrder.statusTimestamps as any) || {};
      const updatedTimestamps = { ...currentTimestamps, cancelled: new Date().toISOString() };

      const [updatedOrder] = await db
        .update(orders)
        .set({
          status: 'cancelled',
          statusTimestamps: updatedTimestamps,
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();

      return NextResponse.json(updatedOrder);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
