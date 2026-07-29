import { NextResponse } from 'next/server';
import { db, orders, eq } from '@lagchow/database';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const updates: any = { status };
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

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
