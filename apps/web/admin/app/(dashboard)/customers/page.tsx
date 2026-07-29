import React from 'react';
import { db } from '@lagchow/database';
import { users, orders } from '@lagchow/database/src/schema';
import { desc, sql, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  
  // Fetch users and aggregate their lifetime spend and order count
  const rawQuery = sql`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.is_student,
      u.hall_of_residence,
      u.created_at,
      COUNT(o.id) AS total_orders,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'delivered'), 0) AS lifetime_spend
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;

  // @ts-ignore
  const { rows: allCustomers } = await db.execute(rawQuery);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Customer Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage users, view lifetime value, and handle disputes.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="p-4 pl-6">Customer</th>
                <th className="p-4">Location / Hall</th>
                <th className="p-4">Total Orders</th>
                <th className="p-4">Lifetime Spend</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <div className="text-lg font-bold mb-1">No customers found.</div>
                    <p className="text-sm">Wait for users to sign up via the app.</p>
                  </td>
                </tr>
              ) : (
                allCustomers.map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold uppercase">
                          {(customer.name || customer.email).substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            {customer.name || 'Anonymous User'}
                            {customer.is_student && (
                              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] rounded uppercase font-black">Student</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {customer.hall_of_residence || 'No default location'}
                    </td>
                    <td className="p-4">
                      <div className="font-bold">{customer.total_orders}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-black text-lg text-accent">₦{Number(customer.lifetime_spend).toLocaleString()}</div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                          View Orders
                        </button>
                        <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                          Ban
                        </button>
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
