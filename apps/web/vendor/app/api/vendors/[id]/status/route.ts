import { NextResponse } from 'next/server';
import { db, vendors } from '@lagchow/database';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
