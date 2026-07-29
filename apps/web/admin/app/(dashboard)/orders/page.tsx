import React from 'react';
import { db } from '@lagchow/database';
import { orders, users, vendors } from '@lagchow/database/src/schema';
import { desc, sql, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Server Action for updating order status
async function updateOrderStatus(orderId: string, newStatus: string) {
  'use server';
  
  await db.update(orders)
    .set({ status: newStatus })
    .where(eq(orders.id, orderId));
    
  revalidatePath('/orders');
}

export const dynamic = 'force-dynamic';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const statusFilter = typeof params.status === 'string' ? params.status : null;

  // Build the query
  let query = db.select({
    id: orders.id,
    totalAmount: orders.totalAmount,
    status: orders.status,
    createdAt: orders.createdAt,
    userEmail: users.email,
    vendorName: vendors.name,
  })
  .from(orders)
  .leftJoin(users, eq(orders.userId, users.id))
  .leftJoin(vendors, eq(orders.vendorId, vendors.id));

  // Apply filters
  if (statusFilter && statusFilter !== 'all') {
    // We have to use raw sql for the condition since drizzle is strongly typed and we are chaining
    query = query.where(eq(orders.status, statusFilter)) as any;
  }

  const allOrders = await query.orderBy(desc(orders.createdAt)).limit(100); // Limit 100 for now

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Mission Control: Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track all platform orders in real-time.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Simple URL-based filter links using query params */}
          <a href="/orders?status=all" className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${!statusFilter || statusFilter === 'all' ? 'bg-accent text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}>All</a>
          <a href="/orders?status=pending" className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${statusFilter === 'pending' ? 'bg-accent text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}>Pending</a>
          <a href="/orders?status=delivered" className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${statusFilter === 'delivered' ? 'bg-accent text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}>Delivered</a>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="p-4 pl-6">Order Details</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Vendor</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No orders found matching your filters.
                  </td>
                </tr>
              ) : (
                allOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-mono text-xs text-muted-foreground mb-1">
                        #{order.id.split('-')[0]}
                      </div>
                      <div className="text-sm">
                        {new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium">{order.userEmail || 'Guest'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-purple-400">{order.vendorName || 'Unknown'}</div>
                    </td>
                    <td className="p-4 font-black">
                      ₦{order.totalAmount?.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {/* Using server actions for immediate mutation without client JS state overhead */}
                      <form action={async () => {
                        'use server';
                        await updateOrderStatus(order.id, order.status === 'delivered' ? 'pending' : 'delivered');
                      }}>
                        <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                          {order.status === 'delivered' ? 'Mark Pending' : 'Mark Delivered'}
                        </button>
                      </form>
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
