import { NextResponse } from 'next/server';
import { db } from '@lagchow/database';
import { vendors } from '@lagchow/database/src/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Try deleting the vendor.
    // If the vendor has orders, it might throw a foreign key constraint error.
    await db.delete(vendors).where(eq(vendors.id, id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting vendor:', error);
    
    // Check for foreign key constraint violation (usually code 23503 in Postgres)
    if (error.code === '23503' || error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { error: 'Cannot delete this vendor because they have existing orders.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete vendor', details: error.message },
      { status: 500 }
    );
  }
}
