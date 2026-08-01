import React from 'react';
import { db } from '@lagchow/database';
import { vendors, orders } from '@lagchow/database/src/schema';
import { desc, sql, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

// Server Action for updating vendor status
async function updateVendorStatus(vendorId: string, newStatus: string) {
  'use server';
  
  await db.update(vendors)
    .set({ status: newStatus })
    .where(eq(vendors.id, vendorId));
    
  revalidatePath('/vendors');
}

// Server Action for deleting a vendor
async function removeVendor(vendorId: string) {
  'use server';
  
  await db.update(vendors)
    .set({ status: 'deleted' })
    .where(eq(vendors.id, vendorId));
    
  revalidatePath('/vendors');
}

export const dynamic = 'force-dynamic';

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const statusFilter = typeof params.status === 'string' ? params.status : null;

  // We need to fetch vendors along with their active orders and revenue
  // We'll do this using a raw query for performance with aggregation
  
  let rawQuery = sql`
    SELECT 
      v.id,
      v.slug,
      v.name,
      v.email,
      v.status,
      v.rating,
      v.created_at,
      COUNT(o.id) FILTER (WHERE o.status NOT IN ('delivered', 'cancelled', 'refunded')) AS active_orders,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'delivered'), 0) AS revenue
    FROM vendors v
    LEFT JOIN orders o ON v.id = o.vendor_id
  `;

  if (statusFilter && statusFilter !== 'all') {
    rawQuery = sql`${rawQuery} WHERE v.status = ${statusFilter}`;
  } else {
    rawQuery = sql`${rawQuery} WHERE v.status != 'deleted'`;
  }

  rawQuery = sql`${rawQuery} GROUP BY v.id ORDER BY v.created_at DESC`;

  // @ts-ignore
  const { rows: allVendors } = await db.execute(rawQuery);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Vendors Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage restaurant partnerships and status.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-white/10 pr-4">
            {/* Simple URL-based filter links */}
            <a href="/vendors?status=all" className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${!statusFilter || statusFilter === 'all' ? 'bg-accent text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}>All</a>
            <a href="/vendors?status=active" className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${statusFilter === 'active' ? 'bg-accent text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}>Active</a>
            <a href="/vendors?status=suspended" className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${statusFilter === 'suspended' ? 'bg-accent text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}>Suspended</a>
            <a href="/vendors?status=pending_first_login" className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${statusFilter === 'pending_first_login' ? 'bg-accent text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}>Pending</a>
          </div>
          <Link 
            href="/vendors/new"
            className="bg-accent text-black px-4 py-2 rounded-lg text-sm font-bold hover:scale-[1.02] transition-transform flex items-center gap-2"
          >
            <span>+</span> Onboard Vendor
          </Link>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="p-4 pl-6">Vendor</th>
                <th className="p-4">Status</th>
                <th className="p-4">Active Orders</th>
                <th className="p-4">Revenue</th>
                <th className="p-4">Rating</th>
                <th className="p-4 pr-6 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No vendors found.
                  </td>
                </tr>
              ) : (
                allVendors.map((vendor: any) => (
                  <tr key={vendor.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="p-4 pl-6">
                      <Link href={`/vendors/${vendor.slug}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold uppercase">
                          {vendor.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-accent transition-colors">{vendor.name}</div>
                          <div className="text-xs text-muted-foreground">{vendor.email || 'No email'}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        vendor.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        vendor.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {vendor.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${Number(vendor.active_orders) > 0 ? 'bg-accent animate-pulse' : 'bg-white/20'}`}></div>
                        <span className="font-bold">{vendor.active_orders}</span>
                      </div>
                    </td>
                    <td className="p-4 font-black">
                      ₦{Number(vendor.revenue).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="font-bold">{vendor.rating}</span>
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Server Actions for Quick Status Updates */}
                        {vendor.status !== 'active' && (
                          <form action={async () => {
                            'use server';
                            await updateVendorStatus(vendor.id, 'active');
                          }}>
                            <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-500/20 text-green-400 hover:bg-green-500/10 transition-colors">
                              Approve
                            </button>
                          </form>
                        )}
                        {vendor.status === 'active' && (
                          <form action={async () => {
                            'use server';
                            await updateVendorStatus(vendor.id, 'suspended');
                          }}>
                            <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                              Suspend
                            </button>
                          </form>
                        )}
                        <Link 
                          href={`/vendors/${vendor.slug}`} 
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors flex items-center justify-center"
                        >
                          View
                        </Link>
                        <form action={async () => {
                          'use server';
                          await removeVendor(vendor.id);
                        }}>
                          <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                            Remove
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
