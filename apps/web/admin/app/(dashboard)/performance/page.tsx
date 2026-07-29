import React from 'react';
import { db } from '@lagchow/database';
import { orders, riders, vendors } from '@lagchow/database/src/schema';
import { sql } from 'drizzle-orm';
import { Gauge, Clock, TruckIcon, CheckCircle, XCircle, Timer, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PerformancePage() {

  // Total orders and breakdown
  const totalResult = await db.execute(sql`SELECT COUNT(*) as total FROM orders`);
  const deliveredResult = await db.execute(sql`SELECT COUNT(*) as total FROM orders WHERE status = 'delivered'`);
  const cancelledResult = await db.execute(sql`SELECT COUNT(*) as total FROM orders WHERE status = 'cancelled'`);
  const pendingResult = await db.execute(sql`SELECT COUNT(*) as total FROM orders WHERE status = 'pending'`);

  const totalOrders = Number((totalResult as any).rows?.[0]?.total ?? 0);
  const deliveredOrders = Number((deliveredResult as any).rows?.[0]?.total ?? 0);
  const cancelledOrders = Number((cancelledResult as any).rows?.[0]?.total ?? 0);
  const pendingOrders = Number((pendingResult as any).rows?.[0]?.total ?? 0);

  const successRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : '0.0';
  const cancelRate = totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : '0.0';

  // Active vs total riders
  const activeRidersResult = await db.execute(sql`SELECT COUNT(*) as total FROM riders WHERE status = 'active'`);
  const totalRidersResult = await db.execute(sql`SELECT COUNT(*) as total FROM riders`);
  const activeRidersCount = Number((activeRidersResult as any).rows?.[0]?.total ?? 0);
  const totalRidersCount = Number((totalRidersResult as any).rows?.[0]?.total ?? 0);

  // Active vs total vendors
  const activeVendorsResult = await db.execute(sql`SELECT COUNT(*) as total FROM vendors WHERE status = 'active'`);
  const totalVendorsResult = await db.execute(sql`SELECT COUNT(*) as total FROM vendors`);
  const activeVendorsCount = Number((activeVendorsResult as any).rows?.[0]?.total ?? 0);
  const totalVendorsCount = Number((totalVendorsResult as any).rows?.[0]?.total ?? 0);

  // Orders by status for funnel
  const statusCounts = [
    { label: 'Pending', count: pendingOrders, color: 'bg-yellow-500' },
    { label: 'Delivered', count: deliveredOrders, color: 'bg-green-500' },
    { label: 'Cancelled', count: cancelledOrders, color: 'bg-red-500' },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Gauge className="w-8 h-8 text-accent" />
          Performance Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Platform health, delivery reliability, and operational efficiency metrics.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Order Success Rate */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Success Rate</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-4xl font-black text-green-400">{successRate}%</div>
          <div className="text-xs text-muted-foreground mt-2">{deliveredOrders} of {totalOrders} delivered</div>
          <div className="w-full bg-white/5 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${successRate}%` }} />
          </div>
        </div>

        {/* Cancellation Rate */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cancellation Rate</span>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-4xl font-black text-red-400">{cancelRate}%</div>
          <div className="text-xs text-muted-foreground mt-2">{cancelledOrders} cancelled orders</div>
          <div className="w-full bg-white/5 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-red-500 h-full rounded-full transition-all" style={{ width: `${cancelRate}%` }} />
          </div>
        </div>

        {/* Rider Availability */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rider Availability</span>
            <TruckIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-4xl font-black">
            <span className="text-blue-400">{activeRidersCount}</span>
            <span className="text-lg text-muted-foreground font-bold">/{totalRidersCount}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">riders currently online</div>
          <div className="w-full bg-white/5 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: totalRidersCount > 0 ? `${(activeRidersCount / totalRidersCount) * 100}%` : '0%' }} />
          </div>
        </div>

        {/* Vendor Uptime */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vendor Uptime</span>
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-4xl font-black">
            <span className="text-yellow-400">{activeVendorsCount}</span>
            <span className="text-lg text-muted-foreground font-bold">/{totalVendorsCount}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">vendors currently active</div>
          <div className="w-full bg-white/5 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-yellow-500 h-full rounded-full transition-all" style={{ width: totalVendorsCount > 0 ? `${(activeVendorsCount / totalVendorsCount) * 100}%` : '0%' }} />
          </div>
        </div>

      </div>

      {/* Order Funnel + Delivery Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Order Funnel */}
        <div className="bg-card border border-white/5 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-6">Order Funnel</h3>
          <div className="space-y-4">
            {statusCounts.map((status) => {
              const percentage = totalOrders > 0 ? (status.count / totalOrders) * 100 : 0;
              return (
                <div key={status.label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-bold">{status.label}</span>
                    <span className="text-muted-foreground font-mono">{status.count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                    <div className={`${status.color} h-full rounded-full transition-all duration-700`} style={{ width: `${Math.max(percentage, 2)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {totalOrders === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-8">No orders yet to analyze.</p>
          )}
        </div>

        {/* Delivery Ecosystem Health */}
        <div className="bg-card border border-white/5 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-6">Delivery Ecosystem Health</h3>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">Fulfillment Pipeline</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Orders flowing from placement → vendor acceptance → delivery</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                Number(successRate) >= 80 ? 'bg-green-500/20 text-green-400' :
                Number(successRate) >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {Number(successRate) >= 80 ? 'HEALTHY' : Number(successRate) >= 50 ? 'ATTENTION' : 'CRITICAL'}
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <TruckIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">Rider Coverage</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Enough active runners to handle incoming demand</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                activeRidersCount >= 3 ? 'bg-green-500/20 text-green-400' :
                activeRidersCount >= 1 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {activeRidersCount >= 3 ? 'HEALTHY' : activeRidersCount >= 1 ? 'LOW' : 'NO COVERAGE'}
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">Vendor Supply</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Active vendors accepting orders on the platform</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                activeVendorsCount >= 5 ? 'bg-green-500/20 text-green-400' :
                activeVendorsCount >= 2 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {activeVendorsCount >= 5 ? 'HEALTHY' : activeVendorsCount >= 2 ? 'LIMITED' : 'CRITICAL'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
