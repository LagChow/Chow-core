import { NextResponse } from 'next/server';
import { db, riders, eq } from '@lagchow/database';
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

    const rider = await db.query.riders.findFirst({
      where: eq(riders.id, riderId)
    });

    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    return NextResponse.json(rider);
  } catch (error) {
    console.error("Error fetching rider status:", error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const riderId = await getRiderIdFromSession();
    if (!riderId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { status, currentLat, currentLng } = body;

    const updates: any = {};
    if (status) updates.status = status;
    if (currentLat !== undefined) updates.currentLat = currentLat;
    if (currentLng !== undefined) updates.currentLng = currentLng;
    updates.updatedAt = new Date();

    const [updatedRider] = await db
      .update(riders)
      .set(updates)
      .where(eq(riders.id, riderId))
      .returning();

    return NextResponse.json(updatedRider);
  } catch (error) {
    console.error("Error updating rider status:", error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
