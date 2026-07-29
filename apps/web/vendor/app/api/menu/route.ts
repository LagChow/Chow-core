import { NextResponse } from 'next/server';
import { db, items, categories, eq } from '@lagchow/database';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId');
    if (!vendorId) return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });

    // Fetch vendor's categories
    const vendorCategories = await db.query.categories.findMany({
      where: eq(categories.vendorId, vendorId)
    });

    if (vendorCategories.length === 0) {
      return NextResponse.json({ categories: [], items: [] });
    }

    // Fetch items for those categories
    // For a complex query, you'd use IN operator, but here we can just fetch all and filter or query properly.
    const allItems = await db.query.items.findMany(); // Assuming a simple db, or we map
    const categoryIds = vendorCategories.map(c => c.id);
    const vendorItems = allItems.filter(item => categoryIds.includes(item.categoryId));

    return NextResponse.json({
      categories: vendorCategories,
      items: vendorItems
    });
  } catch (error) {
    console.error('Failed to fetch menu:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      name, price, description, categoryId, image,
      preparationTime, peakPreparationTime, mealType,
      comboIncludes, portionSize, dailyQuantity, tags, visibility, isAvailable
    } = body;

    if (!name || !price || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newItem] = await db.insert(items).values({
      name,
      price,
      description,
      categoryId,
      image,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      preparationTime: preparationTime || null,
      peakPreparationTime: peakPreparationTime || null,
      mealType: mealType || 'single',
      comboIncludes: comboIncludes || [],
      portionSize: portionSize || null,
      dailyQuantity: dailyQuantity !== undefined ? dailyQuantity : null,
      tags: tags || [],
      visibility: visibility || 'published',
    }).returning();

    return NextResponse.json(newItem);
  } catch (error) {
    console.error('Failed to create item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
