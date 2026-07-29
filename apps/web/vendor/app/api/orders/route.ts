import { NextResponse } from 'next/server';
import { db, orders, eq, desc } from '@lagchow/database';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ error: "Missing vendorId" }, { status: 400 });
    }

    const fetchedOrders = await db.query.orders.findMany({
      where: eq(orders.vendorId, vendorId),
      orderBy: [desc(orders.createdAt)],
      with: {
        items: true,
      }
    });

    return NextResponse.json(fetchedOrders);
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
