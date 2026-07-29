import { NextResponse } from 'next/server';
import { db, orders, eq } from '@lagchow/database';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    const vendorOrders = await db.query.orders.findMany({
      where: eq(orders.vendorId, vendorId)
    });

    let completedOrders = 0;
    let pendingOrders = 0;
    let totalBalance = 0;

    for (const o of vendorOrders) {
      if (o.status === 'delivered') {
        completedOrders++;
        totalBalance += o.totalAmount;
      } else if (['pending', 'accepted', 'preparing'].includes(o.status)) {
        pendingOrders++;
      }
    }

    return NextResponse.json({
      completedOrders,
      pendingOrders,
      totalBalance
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
