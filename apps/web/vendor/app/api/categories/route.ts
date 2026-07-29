import { NextResponse } from 'next/server';
import { db, categories } from '@lagchow/database';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, vendorId } = body;

    if (!name || !vendorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newCategory] = await db.insert(categories).values({
      name,
      vendorId,
    }).returning();

    return NextResponse.json(newCategory);
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
