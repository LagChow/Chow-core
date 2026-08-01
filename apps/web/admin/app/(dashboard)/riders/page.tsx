import React from 'react';
import { db } from '@lagchow/database';
import { riders, orders } from '@lagchow/database/src/schema';
import { desc, sql, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { OnboardRiderModal } from '@/components/onboard-rider-modal';

// Server Action for updating rider status
async function updateRiderStatus(riderId: string, newStatus: string) {
  'use server';
  
  await db.update(riders)
    .set({ status: newStatus })
    .where(eq(riders.id, riderId));
    
  revalidatePath('/riders');
}

export const dynamic = 'force-dynamic';

export default async function RidersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const statusFilter = typeof params.status === 'string' ? params.status : null;

  let rawQuery = sql`
    SELECT 
      r.id,
      r.name,
      r.email,
      r.phone,
      r.vehicle_type as "vehicleType",
      r.status,
      r.created_at,
      COUNT(o.id) FILTER (WHERE o.status = 'delivered') AS total_deliveries
    FROM riders r
    LEFT JOIN orders o ON r.id = o.rider_id
  `;

  if (statusFilter && statusFilter !== 'all') {
    rawQuery = sql`${rawQuery} WHERE r.status = ${statusFilter}`;
  }

  rawQuery = sql`${rawQuery} GROUP BY r.id ORDER BY r.created_at DESC`;

  // @ts-ignore
  const { rows: allRiders } = await db.execute(rawQuery);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Riders Fleet</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage Campus Runners and delivery personnel.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-white/10 pr-4">
            <a href="/riders?status=all" className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${!statusFilter || statusFilter === 'all' ? 'bg-accent text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}>All</a>
            <a href="/riders?status=active" className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${statusFilter === 'active' ? 'bg-accent text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}>Active</a>
            <a href="/riders?status=offline" className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${statusFilter === 'offline' ? 'bg-accent text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}>Offline</a>
            <a href="/riders?status=pending" className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${statusFilter === 'pending' ? 'bg-accent text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}>Pending</a>
          </div>
          <OnboardRiderModal>
            <button className="bg-accent text-black px-4 py-2 rounded-lg text-sm font-bold hover:scale-[1.02] transition-transform">
              Onboard Rider
            </button>
          </OnboardRiderModal>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="p-4 pl-6">Rider Details</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Status</th>
                <th className="p-4">Total Deliveries</th>
                <th className="p-4 pr-6 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allRiders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <div className="text-lg font-bold mb-1">No riders found.</div>
                    <p className="text-sm">Start by onboarding your first Campus Runner.</p>
                  </td>
                </tr>
              ) : (
                allRiders.map((rider: any) => (
                  <tr key={rider.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold uppercase">
                          {rider.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{rider.name}</div>
                          <div className="text-xs text-muted-foreground">{rider.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-white/5 rounded text-xs font-semibold uppercase tracking-wider text-white/80">
                        {rider.vehicleType}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        rider.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        rider.status === 'offline' ? 'bg-gray-500/20 text-gray-400' :
                        rider.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {rider.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-black text-lg">{rider.total_deliveries}</div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        {rider.status !== 'active' && rider.status !== 'suspended' && (
                          <form action={async () => {
                            'use server';
                            await updateRiderStatus(rider.id, 'active');
                          }}>
                            <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-500/20 text-green-400 hover:bg-green-500/10 transition-colors">
                              Approve
                            </button>
                          </form>
                        )}
                        {rider.status === 'active' && (
                          <form action={async () => {
                            'use server';
                            await updateRiderStatus(rider.id, 'suspended');
                          }}>
                            <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                              Suspend
                            </button>
                          </form>
                        )}
                        <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                          Track
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
