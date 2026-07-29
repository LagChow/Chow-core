import { NextResponse } from 'next/server';
import { db, savedVendors, eq, and } from '@lagchow/database';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

async function getUserFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('__session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.id as string | undefined;
}

export async function GET() {
  try {
    const userId = await getUserFromSession();
    if (!userId) {
      return NextResponse.json({ saved: [] }); // Not logged in, return empty array
    }

    const saved = await db.query.savedVendors.findMany({
      where: eq(savedVendors.userId, userId),
      columns: {
        vendorId: true,
      },
    });

    return NextResponse.json({ saved: saved.map(s => s.vendorId) });
  } catch (error) {
    console.error('Fetch saved vendors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vendorId } = await req.json();
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Check if already saved
    const existing = await db.query.savedVendors.findFirst({
      where: and(
        eq(savedVendors.userId, userId),
        eq(savedVendors.vendorId, vendorId)
      )
    });

    if (existing) {
      // Unsave
      await db.delete(savedVendors)
        .where(eq(savedVendors.id, existing.id));
      return NextResponse.json({ ok: true, saved: false });
    } else {
      // Save
      await db.insert(savedVendors).values({
        userId,
        vendorId,
      });
      return NextResponse.json({ ok: true, saved: true });
    }
  } catch (error) {
    console.error('Toggle saved vendor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
