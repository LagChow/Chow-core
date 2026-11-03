import { NextResponse } from 'next/server';
import { db, orders, riders, vendors, batchGroups, landmarks } from '@lagchow/database';
import { eq, inArray, desc, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

async function isAdmin() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('__admin_session')?.value || cookieStore.get('__session')?.value;
  if (!sessionToken) return false;
  try {
    const decoded = await verifyToken(sessionToken);
    return Boolean(decoded && (decoded.role === 'admin' || decoded.role === 'super_admin'));
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch active orders (not delivered or cancelled)
    const activeOrdersRaw = await db
      .select({
        order: orders,
        vendorName: vendors.name,
        riderName: riders.name,
        riderVehicle: riders.vehicleType,
      })
      .from(orders)
      .leftJoin(vendors, eq(orders.vendorId, vendors.id))
      .leftJoin(riders, eq(orders.riderId, riders.id))
      .where(
        inArray(orders.status, [
          'pending',
          'accepted',
          'preparing',
          'ready',
          'rider_accepted',
          'rider_at_vendor',
          'out_for_delivery',
          'arrived'
        ])
      )
      .orderBy(desc(orders.createdAt));

    // 2. Fetch all riders with their current capacity and GPS status
    const allRiders = await db
      .select()
      .from(riders)
      .orderBy(desc(riders.currentOrderCount), desc(riders.updatedAt));

    // 3. Fetch open/active batch groups
    const activeBatches = await db
      .select({
        batch: batchGroups,
        vendorName: vendors.name,
      })
      .from(batchGroups)
      .leftJoin(vendors, eq(batchGroups.vendorId, vendors.id))
      .where(inArray(batchGroups.status, ['open', 'dispatched']))
      .orderBy(desc(batchGroups.createdAt));

    // 4. Fetch campus landmarks (checkpoints)
    const allLandmarks = await db
      .select()
      .from(landmarks)
      .orderBy(landmarks.name);

    return NextResponse.json({
      activeOrders: activeOrdersRaw.map(r => ({
        ...r.order,
        vendorName: r.vendorName,
        riderName: r.riderName,
        riderVehicle: r.riderVehicle,
      })),
      riders: allRiders,
      activeBatches: activeBatches.map(b => ({
        ...b.batch,
        vendorName: b.vendorName,
      })),
      landmarks: allLandmarks,
    });
  } catch (error) {
    console.error('Error fetching delivery ops data:', error);
    return NextResponse.json({ error: 'Failed to load delivery operations data' }, { status: 500 });
  }
}

// POST: Create a new campus landmark checkpoint OR manually assign/unassign a rider
export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Action A: Add a new Campus Landmark Checkpoint
    if (action === 'create_landmark') {
      const { name, lat, lng, radiusMeters, routeTags } = body;
      if (!name || lat === undefined || lng === undefined) {
        return NextResponse.json({ error: 'Name, lat, and lng are required' }, { status: 400 });
      }

      const [created] = await db
        .insert(landmarks)
        .values({
          name,
          lat: Number(lat),
          lng: Number(lng),
          radiusMeters: Number(radiusMeters || 30),
          routeTags: routeTags || [],
          isActive: true,
        })
        .returning();

      return NextResponse.json(created);
    }

    // Action B: Force Reassign / Override Rider on an Order
    if (action === 'assign_rider') {
      const { orderId, newRiderId } = body;
      if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
      }

      const existing = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!existing) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Decrement old rider's count if there was one
      if (existing.riderId) {
        await db.execute(sql`
          UPDATE riders 
          SET current_order_count = GREATEST(0, current_order_count - 1),
              updated_at = NOW()
          WHERE id = ${existing.riderId}
        `);
      }

      // Increment new rider's count if assigning to a new rider
      if (newRiderId) {
        await db.execute(sql`
          UPDATE riders 
          SET current_order_count = current_order_count + 1,
              updated_at = NOW()
          WHERE id = ${newRiderId}
        `);
      }

      const [updated] = await db
        .update(orders)
        .set({
          riderId: newRiderId || null,
          status: newRiderId ? 'rider_accepted' : 'ready',
          dispatchedAt: newRiderId ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in delivery ops POST:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
