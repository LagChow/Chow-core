import { NextResponse } from 'next/server';
import { db, orders, eq, and } from '@lagchow/database';
import { isNull } from 'drizzle-orm';
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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const riderId = await getRiderIdFromSession();
    if (!riderId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Edge Case 3: Two riders claim simultaneously
    // Strict SQL transaction lock condition: rider_id MUST be null.
    // If it's not null, it means someone else beat them to it!
    const [claimedOrder] = await db
      .update(orders)
      .set({
        riderId,
        status: 'rider_accepted',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(orders.id, resolvedParams.id),
          isNull(orders.riderId) as any // Transactional Lock!
        )
      )
      .returning();

    if (!claimedOrder) {
      // If we got here, either the order doesn't exist, OR rider_id was no longer null!
      return NextResponse.json({ error: 'Order is no longer available. Another rider may have claimed it.' }, { status: 409 });
    }

    return NextResponse.json(claimedOrder);
  } catch (error) {
    console.error("Error claiming delivery:", error);
    return NextResponse.json({ error: 'Failed to claim delivery' }, { status: 500 });
  }
}
