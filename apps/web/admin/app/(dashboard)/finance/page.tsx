import React from 'react';
import { db } from '@lagchow/database';
import { orders, vendors, users, riders } from '@lagchow/database/src/schema';
import { desc, sql, eq } from 'drizzle-orm';
import Link from 'next/link';
import { DollarSign, Activity, Percent } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  
  // Fetch recent orders for the ledger
  const ledgerOrders = await db.select({
    id: orders.id,
    totalAmount: orders.totalAmount,
    deliveryFee: orders.deliveryFee,
    convenienceFee: orders.convenienceFee,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    createdAt: orders.createdAt,
    vendorName: vendors.name,
    userEmail: users.email,
    riderType: riders.vehicleType,
  })
  .from(orders)
  .leftJoin(vendors, eq(orders.vendorId, vendors.id))
  .leftJoin(users, eq(orders.userId, users.id))
  .leftJoin(riders, eq(orders.riderId, riders.id))
  .orderBy(desc(orders.createdAt))
  .limit(100);

  // Calculate high level metrics
  // In a real app we might do this with a single aggregation query, but let's do it in JS for flexibility here
  let totalGMV = 0;
  let totalPlatformFee = 0; // Convenience fees
  let totalDeliveryFee = 0;
  let totalMonnifyFees = 0;

  const enrichedLedger = ledgerOrders.map(order => {
    const amount = order.totalAmount || 0;
    const convFee = order.convenienceFee || 0;
    const devFee = order.deliveryFee || 0;
    
    // Monnify Fee: 1.5% capped at 2000
    const rawMonnify = amount * 0.015;
    const monnifyFee = rawMonnify > 2000 ? 2000 : rawMonnify;

    // Delivery Commission Logic
    let deliveryCommission = 0;
    let actualRiderPayout = devFee;
    
    // Match based on rider type or exact delivery fee as a fallback
    if (order.riderType === 'walker' || devFee === 400) {
      deliveryCommission = 100;
      actualRiderPayout = devFee - 100; // 300 payout
    } else if (order.riderType === 'bicycle' || devFee >= 500) {
      deliveryCommission = 70;
      actualRiderPayout = devFee - 70; // 430 payout
    }

    // Platform Net Revenue = Convenience Fee + Delivery Commission - Monnify Fee
    const netPlatformFee = convFee + deliveryCommission - monnifyFee;

    // Vendor Payout = Total Amount - Convenience Fee - Delivery Fee
    const vendorPayout = amount - convFee - devFee;

    // Accumulate metrics for successful/delivered orders
    if (order.status === 'delivered') {
      totalGMV += amount;
      totalPlatformFee += convFee + deliveryCommission; // Platform gross
      totalDeliveryFee += actualRiderPayout;
      totalMonnifyFees += monnifyFee;
    }

    return {
      ...order,
      monnifyFee,
      netPlatformFee,
      vendorPayout,
      actualRiderPayout
    };
  });

  const netRevenue = totalPlatformFee - totalMonnifyFees;

  return (
    <div className="flex flex-col gap-8 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Finance Ledger</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track Gross Merchandise Value, gateway fees, and platform profitability.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* GMV */}
        <div className="p-6 rounded-2xl bg-card border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Gross Merchandise Value</span>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter">
              ₦{totalGMV.toLocaleString()}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-muted-foreground">
              Total volume of all delivered orders
            </div>
          </div>
        </div>

        {/* Monnify Fees */}
        <div className="p-6 rounded-2xl bg-card border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Monnify Gateway Fees</span>
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter text-red-400">
              -₦{totalMonnifyFees.toLocaleString()}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-muted-foreground">
              1.5% capped at ₦2,000
            </div>
          </div>
        </div>

        {/* Delivery Payouts */}
        <div className="p-6 rounded-2xl bg-card border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rider Payouts</span>
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter">
              ₦{totalDeliveryFee.toLocaleString()}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-muted-foreground">
              100% of delivery fees
            </div>
          </div>
        </div>

        {/* Net Platform Revenue */}
        <div className="p-6 rounded-2xl bg-accent/10 border border-accent/20 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Net Platform Revenue</span>
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter text-accent">
              ₦{Math.round(netRevenue).toLocaleString()}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm font-bold text-accent/70">
              Conv. Fees + Delivery Comm. - Gateway
            </div>
          </div>
        </div>

      </div>

      {/* Money Flow Ledger */}
      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden mt-4">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Money Flow Ledger</h3>
            <p className="text-sm text-muted-foreground">Detailed fee breakdown per transaction (Recent 100)</p>
          </div>
          <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
            Export CSV
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="p-4 pl-6">ID & Date</th>
                <th className="p-4">Gross Amt</th>
                <th className="p-4">Vendor Payout</th>
                <th className="p-4">Rider Fee</th>
                <th className="p-4 text-red-400">Monnify Fee</th>
                <th className="p-4 text-accent">Net Rev</th>
                <th className="p-4 pr-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {enrichedLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                enrichedLedger.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-mono text-xs font-bold">#{order.id.split('-')[0]}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-4 font-black">
                      ₦{order.totalAmount?.toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-white/80">
                      ₦{order.vendorPayout.toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-white/80">
                      ₦{order.actualRiderPayout?.toLocaleString()}
                      <span className="text-[10px] text-muted-foreground ml-2 block">Gross: ₦{order.deliveryFee}</span>
                    </td>
                    <td className="p-4 font-bold text-red-400">
                      -₦{Math.round(order.monnifyFee).toLocaleString()}
                    </td>
                    <td className="p-4 font-black text-accent">
                      ₦{Math.round(order.netPlatformFee).toLocaleString()}
                    </td>
                    <td className="p-4 pr-6">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        order.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' :
                        order.paymentStatus === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {order.paymentStatus}
                      </span>
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
