import { NextResponse } from 'next/server';
import { db, vendors, categories, items } from '@lagchow/database';
import { eq, or } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeQueueStatus(raw: any, fallbackTime?: string | null) {
  const q = raw && typeof raw === 'object' ? raw : {};
  const status = q.status || 'Available';
  const demand = q.demand || (status === 'Rush Hour' ? 'High' : status === 'Moderate' ? 'Moderate' : 'Low');
  const color = q.color || (status === 'Rush Hour' ? 'red' : status === 'Moderate' ? 'yellow' : 'green');
  const time = q.time || fallbackTime || (status === 'Rush Hour' ? '45+ min' : status === 'Moderate' ? '25-35 min' : '15-25 min');
  return { status, demand, color, time };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: slugOrId } = await params;
    
    const whereClause = UUID_REGEX.test(slugOrId)
      ? or(eq(vendors.id, slugOrId), eq(vendors.slug, slugOrId))
      : eq(vendors.slug, slugOrId);

    const allVendors = await db.select().from(vendors).where(whereClause);
    if (allVendors.length === 0) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }
    
    const vendor = allVendors[0];
    
    // Fetch categories and items
    const vendorCategories = await db.select().from(categories).where(eq(categories.vendorId, vendor.id));
    const allItems = await db.select().from(items);

    const formattedCategories = vendorCategories.map(category => {
      const categoryItems = allItems.filter(i => i.categoryId === category.id);
      return {
        id: category.id,
        name: category.name,
        items: categoryItems
      };
    });

    const queueStatus = normalizeQueueStatus(vendor.queueStatus, vendor.deliveryTime);

    const formattedVendor = {
      ...vendor,
      dbId: vendor.id,
      id: vendor.slug, // map slug back to id
      queueStatus,
      deliveryTime: queueStatus.time,
      categories: formattedCategories
    };

    return NextResponse.json({ vendor: formattedVendor });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
