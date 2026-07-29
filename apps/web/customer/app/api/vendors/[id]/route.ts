import { NextResponse } from 'next/server';
import { db, vendors, categories, items } from '@lagchow/database';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: slug } = await params;
    
    const allVendors = await db.select().from(vendors).where(eq(vendors.slug, slug));
    if (allVendors.length === 0) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }
    
    const vendor = allVendors[0];
    
    // Fetch categories and items
    const vendorCategories = await db.select().from(categories).where(eq(categories.vendorId, vendor.id));
    const allItems = await db.select().from(items); // we can optimize by filtering by categoryId in SQL, but this is fine for now

    const formattedCategories = vendorCategories.map(category => {
      const categoryItems = allItems.filter(i => i.categoryId === category.id);
      return {
        id: category.id,
        name: category.name,
        items: categoryItems
      };
    });

    const formattedVendor = {
      ...vendor,
      id: vendor.slug, // map slug back to id
      categories: formattedCategories
    };

    return NextResponse.json({ vendor: formattedVendor });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
