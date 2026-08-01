import { NextResponse } from 'next/server';
import { db } from '@lagchow/database';
import { orders, riders, vendors } from '@lagchow/database/src/schema';
import { eq, inArray, isNull, isNotNull, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

async function getAdminIdFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('__session')?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'superadmin')) return null;
    return payload.id;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const adminId = await getAdminIdFromSession();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch Delivery Pool (Unassigned Orders)
    const deliveryPoolRaw = await db.select({
      order: orders,
      vendor: vendors,
    })
    .from(orders)
    .leftJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(
      and(
        isNull(orders.riderId),
        inArray(orders.status, ['accepted', 'preparing', 'ready'])
      )
    );

    const deliveryPool = deliveryPoolRaw.map(row => ({
      ...row.order,
      vendor: row.vendor,
    }));

    // 2. Fetch Active Deliveries (Assigned Orders)
    const activeDeliveriesRaw = await db.select({
      order: orders,
      vendor: vendors,
      rider: riders,
    })
    .from(orders)
    .leftJoin(vendors, eq(orders.vendorId, vendors.id))
    .leftJoin(riders, eq(orders.riderId, riders.id))
    .where(
      and(
        isNotNull(orders.riderId),
        inArray(orders.status, ['rider_accepted', 'rider_at_vendor', 'out_for_delivery', 'arrived'])
      )
    );

    const activeDeliveries = activeDeliveriesRaw.map(row => ({
      ...row.order,
      vendor: row.vendor,
      rider: row.rider,
    }));

    return NextResponse.json({
      deliveryPool,
      activeDeliveries
    });

  } catch (error) {
    console.error("Error fetching delivery ops:", error);
    return NextResponse.json({ error: 'Failed to fetch delivery operations' }, { status: 500 });
  }
}
