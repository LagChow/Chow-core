import React from 'react';
import { db } from '@lagchow/database';
import { vendors, orders } from '@lagchow/database/src/schema';
import { desc, sql, eq } from 'drizzle-orm';
import Link from 'next/link';
import { Crown, TrendingUp, ShoppingCart, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TopVendorsPage() {

  const topVendors = await db.execute(sql`
    SELECT 
      v.id,
      v.name,
      v.slug,
      v.cover_image,
      v.rating,
      v.status,
      COUNT(o.id) AS total_orders,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'delivered'), 0) AS total_revenue,
      COALESCE(AVG(o.total_amount) FILTER (WHERE o.status = 'delivered'), 0) AS avg_order_value
    FROM vendors v
    LEFT JOIN orders o ON v.id = o.vendor_id
    GROUP BY v.id
    ORDER BY total_orders DESC, total_revenue DESC
    LIMIT 25
  `);

  // @ts-ignore
  const vendorList = topVendors.rows;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Crown className="w-8 h-8 text-yellow-500" />
          Top Vendors
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ranked by total orders and lifetime revenue generated on LagChow.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {vendorList.length === 0 ? (
          <div className="bg-card border border-white/5 rounded-2xl p-12 text-center text-muted-foreground">
            No vendor data yet. Vendors will appear here once orders come in.
          </div>
        ) : (
          vendorList.map((vendor: any, index: number) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              className="bg-card border border-white/5 rounded-2xl p-6 flex items-center gap-6 hover:bg-white/[0.02] transition-colors group"
            >
              {/* Rank */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
                index === 0 ? 'bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500/30' :
                index === 1 ? 'bg-gray-400/20 text-gray-300 ring-2 ring-gray-400/30' :
                index === 2 ? 'bg-orange-700/20 text-orange-400 ring-2 ring-orange-700/30' :
                'bg-white/5 text-muted-foreground'
              }`}>
                #{index + 1}
              </div>

              {/* Vendor Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg truncate group-hover:text-accent transition-colors">{vendor.name}</h3>
                  <span className={`px-2 py-0.5 text-[9px] rounded uppercase font-black tracking-wider ${
                    vendor.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {vendor.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    {vendor.rating}
                  </span>
                  <span>@{vendor.slug}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 shrink-0">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Orders</div>
                  <div className="text-2xl font-black mt-1">{Number(vendor.total_orders)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Revenue</div>
                  <div className="text-2xl font-black text-accent mt-1">₦{Number(vendor.total_revenue).toLocaleString()}</div>
                </div>
                <div className="text-right hidden lg:block">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">AOV</div>
                  <div className="text-2xl font-black mt-1">₦{Math.round(Number(vendor.avg_order_value)).toLocaleString()}</div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
