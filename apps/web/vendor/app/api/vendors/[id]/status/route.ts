import { NextResponse } from 'next/server';
import { db, vendors } from '@lagchow/database';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

async function getVendorIdFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('__session')?.value;
  if (!token) return null;
  try {
    const decoded = await verifyToken(token);
    return (decoded?.vendorId as string) || null;
  } catch {
    return null;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionVendorId = await getVendorIdFromSession();
    const { id } = await params;

    if (!sessionVendorId || sessionVendorId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { queueStatus } = body;

    if (!queueStatus) {
      return NextResponse.json(
        { error: 'queueStatus is required' },
        { status: 400 }
      );
    }

    const updatedVendor = await db
      .update(vendors)
      .set({
        queueStatus: queueStatus,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, id))
      .returning();

    if (updatedVendor.length === 0) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Status updated successfully',
      vendor: updatedVendor[0],
    });
  } catch (error) {
    console.error('Error updating vendor status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
