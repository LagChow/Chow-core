import { NextResponse } from 'next/server';
import { db, items, eq } from '@lagchow/database';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });

    const body = await req.json();

    // Drizzle expects a Date object for timestamp columns
    if (body.restockTime !== undefined && body.restockTime !== null) {
      body.restockTime = new Date(body.restockTime);
    }

    const [updatedItem] = await db
      .update(items)
      .set(body)
      .where(eq(items.id, id))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Failed to update item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });

    const [deletedItem] = await db
      .delete(items)
      .where(eq(items.id, id))
      .returning();

    if (!deletedItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
