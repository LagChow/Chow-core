import React from 'react';
import { 
  Users, 
  Store, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Activity,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@lagchow/database';
import { vendors, users, orders } from '@lagchow/database/src/schema';
import { desc, sql } from 'drizzle-orm';
import { DashboardCharts } from '@/components/dashboard-charts';

// Force dynamic to ensure fresh metrics on load, or we can rely on Next.js cache with revalidate
export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  
  // Parallel fetching for ultra-fast load times
  const [
    vendorsResult,
    usersResult,
    ordersResult,
    totalRevenueResult,
    recentVendors,
    recentOrdersQuery,
    allOrders
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(vendors),
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(orders),
    db.select({ total: sql<number>`sum(${orders.totalAmount})` }).from(orders),
    db.select({
      id: vendors.id,
      name: vendors.name,
      email: vendors.email,
      status: vendors.status,
      createdAt: vendors.createdAt,
    }).from(vendors).orderBy(desc(vendors.createdAt)).limit(5),
    db.select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
      userEmail: users.email,
      vendorName: vendors.name,
    }).from(orders)
      .leftJoin(users, sql`${orders.userId} = ${users.id}`)
      .leftJoin(vendors, sql`${orders.vendorId} = ${vendors.id}`)
      .orderBy(desc(orders.createdAt)).limit(5),
    db.select({
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt
    }).from(orders)
  ]);

  const metrics = {
    totalVendors: Number(vendorsResult[0].count) || 0,
    totalCustomers: Number(usersResult[0].count) || 0,
    totalOrders: Number(ordersResult[0].count) || 0,
    totalRevenue: Number(totalRevenueResult[0].total) || 0,
    aov: 0
  };
  metrics.aov = metrics.totalOrders > 0 ? Math.round(metrics.totalRevenue / metrics.totalOrders) : 0;

  // Chart Data Preparation
  const chartData: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    chartData.push({
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: 0,
      orders: 0
    });
  }

  allOrders.forEach(o => {
    const oDate = new Date(o.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
    const index = chartData.findIndex(c => c.date === oDate);
    if (index !== -1) {
      chartData[index].revenue += o.totalAmount;
      chartData[index].orders += 1;
    }
  });

  // Dummy data if empty
  if (metrics.totalOrders === 0) {
    chartData[0] = { date: chartData[0].date, revenue: 15000, orders: 12 };
    chartData[1] = { date: chartData[1].date, revenue: 32000, orders: 24 };
    chartData[2] = { date: chartData[2].date, revenue: 28000, orders: 19 };
    chartData[3] = { date: chartData[3].date, revenue: 45000, orders: 35 };
    chartData[4] = { date: chartData[4].date, revenue: 39000, orders: 28 };
    chartData[5] = { date: chartData[5].date, revenue: 52000, orders: 40 };
    chartData[6] = { date: chartData[6].date, revenue: 61000, orders: 45 };
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Welcome back to the LagChow Admin Panel. Here is what's happening today.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="p-6 rounded-2xl bg-card border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-24 h-24 text-accent rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</span>
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter">
              ₦{metrics.totalRevenue.toLocaleString()}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-green-500">
              <TrendingUp className="w-4 h-4" />
              <span>+12.5% from last week</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-6 rounded-2xl bg-card border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingCart className="w-24 h-24 text-blue-500 rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Orders</span>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter">
              {metrics.totalOrders.toLocaleString()}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-green-500">
              <TrendingUp className="w-4 h-4" />
              <span>+8.2% from last week</span>
            </div>
          </div>
        </div>

        {/* Total Vendors */}
        <div className="p-6 rounded-2xl bg-card border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Store className="w-24 h-24 text-purple-500 rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Registered Vendors</span>
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter">
              {metrics.totalVendors.toLocaleString()}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span>Consistent growth</span>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="p-6 rounded-2xl bg-card border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-24 h-24 text-rose-500 rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Users</span>
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter">
              {metrics.totalCustomers.toLocaleString()}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-green-500">
              <TrendingUp className="w-4 h-4" />
              <span>+24 new this week</span>
            </div>
          </div>
        </div>
        {/* Average Order Value (AOV) */}
        <div className="p-6 rounded-2xl bg-card border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-24 h-24 text-teal-500 rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">AOV</span>
            <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-500">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter">
              ₦{metrics.aov.toLocaleString()}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-green-500">
              <TrendingUp className="w-4 h-4" />
              <span>Healthy margin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Charts Section */}
      <DashboardCharts chartData={chartData} />

      {/* Recent Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Vendors */}
        <div className="bg-card border border-white/5 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Recently Onboarded</h3>
              <p className="text-sm text-muted-foreground">Latest vendors to join the platform</p>
            </div>
            <Link href="/vendors" className="text-sm font-semibold text-accent hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 p-0">
            {recentVendors.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No vendors yet.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentVendors.map((vendor: any) => (
                  <div key={vendor.id} className="p-4 px-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold uppercase">
                        {vendor.name.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold">{vendor.name}</h4>
                        <p className="text-xs text-muted-foreground">{vendor.email || vendor.phone || 'No contact provided'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/70">
                        {vendor.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-card border border-white/5 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Live Orders Feed</h3>
              <p className="text-sm text-muted-foreground">Real-time pulse of marketplace orders</p>
            </div>
            <Link href="/orders" className="text-sm font-semibold text-accent hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 p-0">
            {recentOrdersQuery.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No orders yet.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentOrdersQuery.map((order: any) => (
                  <div key={order.id} className="p-4 px-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div>
                      <h4 className="font-bold">₦{order.totalAmount?.toLocaleString()} <span className="text-muted-foreground font-normal text-sm ml-2">from {order.vendorName || 'Vendor'}</span></h4>
                      <p className="text-xs text-muted-foreground mt-1 text-blue-400 truncate max-w-[200px]">
                        {order.userEmail || 'Guest User'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {order.status}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
