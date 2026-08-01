import { NextResponse } from 'next/server';
import { db, vendors, categories, items } from '@lagchow/database';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allVendors = await db.select().from(vendors).where(eq(vendors.status, 'active'));
    
    // We also need to attach categories and items so it matches the mock data format
    // for the homepage right now (or we can just return vendors if homepage doesn't need items).
    // Actually, homepage uses `vendor.categories`? Let's fetch them all to be safe and match the mock.
    
    const allCategories = await db.select().from(categories);
    const allItems = await db.select().from(items);

    const formattedVendors = allVendors.map(vendor => {
      const vendorCategories = allCategories.filter(c => c.vendorId === vendor.id);
      
      const formattedCategories = vendorCategories.map(category => {
        const categoryItems = allItems.filter(i => i.categoryId === category.id);
        return {
          id: category.id,
          name: category.name,
          items: categoryItems
        };
      });

      return {
        ...vendor,
        id: vendor.slug, // mapping slug back to id to avoid breaking frontend
        categories: formattedCategories
      };
    });

    return NextResponse.json({ vendors: formattedVendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
