import { NextResponse } from 'next/server';
import { db, orders, eq, and } from '@lagchow/database';
import { isNull, inArray } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

async function getRiderIdFromSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('__session')?.value;
  if (!sessionToken) return null;
  try {
    const decoded = await verifyToken(sessionToken);
    if (!decoded) return null;
    return decoded.riderId as string;
  } catch (e) {
    return null;
  }
}

export async function GET() {
  try {
    const riderId = await getRiderIdFromSession();
    if (!riderId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // A rider might already have an active delivery. Check that first.
    const activeDelivery = await db.query.orders.findFirst({
      where: and(
        eq(orders.riderId, riderId),
        inArray(orders.status, ['rider_accepted', 'rider_at_vendor', 'out_for_delivery', 'arrived'])
      ),
      with: {
        vendor: true, // Need vendor details for pickup
      }
    });

    if (activeDelivery) {
      return NextResponse.json({ activeDelivery, availableDeliveries: [] });
    }

    // If no active delivery, fetch the delivery pool (unassigned orders)
    const availableDeliveries = await db.query.orders.findMany({
      where: and(
        isNull(orders.riderId),
        inArray(orders.status, ['accepted', 'preparing', 'ready'])
      ),
      with: {
        vendor: true, // Need vendor details to show pickup location
      },
      orderBy: (orders, { asc }) => [asc(orders.createdAt)],
      limit: 20
    });

    return NextResponse.json({ activeDelivery: null, availableDeliveries });
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 });
  }
}
