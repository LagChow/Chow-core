import { NextResponse } from 'next/server';
import { db, vendors, categories, items } from '@lagchow/database';
import { eq } from 'drizzle-orm';

function normalizeQueueStatus(raw: any, fallbackTime?: string | null) {
  const q = raw && typeof raw === 'object' ? raw : {};
  const status = q.status || 'Available';
  const demand = q.demand || (status === 'Rush Hour' ? 'High' : status === 'Moderate' ? 'Moderate' : 'Low');
  const color = q.color || (status === 'Rush Hour' ? 'red' : status === 'Moderate' ? 'yellow' : 'green');
  const time = q.time || fallbackTime || (status === 'Rush Hour' ? '45+ min' : status === 'Moderate' ? '25-35 min' : '15-25 min');
  return { status, demand, color, time };
}

export async function GET() {
  try {
    const allVendors = await db.select().from(vendors).where(eq(vendors.status, 'active'));
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

      const queueStatus = normalizeQueueStatus(vendor.queueStatus, vendor.deliveryTime);

      return {
        ...vendor,
        dbId: vendor.id,
        id: vendor.slug, // mapping slug back to id to avoid breaking frontend
        queueStatus,
        deliveryTime: queueStatus.time,
        categories: formattedCategories
      };
    });

    return NextResponse.json({ vendors: formattedVendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
