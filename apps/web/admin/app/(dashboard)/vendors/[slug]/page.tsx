import React from 'react';
import { db } from '@lagchow/database';
import { vendors, categories, items, orders, users } from '@lagchow/database/src/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { CoverImageUpload } from '@/components/vendors/cover-image-upload';

export const dynamic = 'force-dynamic';

export default async function VendorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const resolvedSearchParams = await searchParams;
  const tab = typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : 'overview';

  // Fetch basic vendor info
  const [vendor] = await db.select().from(vendors).where(eq(vendors.slug, slug)).limit(1);

  if (!vendor) {
    notFound();
  }

  // Common UI elements
  const Tabs = () => (
    <div className="flex items-center gap-1 border-b border-white/5 mt-8 overflow-x-auto no-scrollbar">
      {['overview', 'menu', 'orders', 'settings'].map((t) => (
        <Link 
          key={t}
          href={`/vendors/${slug}?tab=${t}`}
          className={`px-6 py-3 font-semibold text-sm capitalize border-b-2 transition-colors ${
            tab === t 
              ? 'border-accent text-accent' 
              : 'border-transparent text-muted-foreground hover:text-white hover:border-white/20'
          }`}
        >
          {t}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Vendor Header */}
      <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden bg-white/5 border border-white/10 group">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity"
          style={{ backgroundImage: `url(${vendor.coverImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-black rounded-full ${
                vendor.status === 'active' ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'
              }`}>
                {vendor.status?.replace(/_/g, ' ') || 'Unknown'}
              </span>
              <span className="text-white/80 text-sm font-semibold flex items-center gap-1">
                <span className="text-yellow-400">★</span> {vendor.rating}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{vendor.name}</h1>
            <p className="text-white/60 mt-2 font-medium">{vendor.email} • {vendor.phone}</p>
          </div>
          <div className="flex items-center gap-2">
            <CoverImageUpload vendorId={vendor.id} vendorSlug={vendor.slug} />
            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold backdrop-blur-md transition-colors h-10">
              Contact Vendor
            </button>
          </div>
        </div>
      </div>

      <Tabs />

      {/* Tab Content */}
      <div className="mt-4">
        {tab === 'overview' && <OverviewTab vendor={vendor} />}
        {tab === 'menu' && <MenuTab vendorId={vendor.id} />}
        {tab === 'orders' && <OrdersTab vendorId={vendor.id} />}
        {tab === 'settings' && <SettingsTab vendor={vendor} />}
      </div>

    </div>
  );
}

// --------------------------------------------------------------------------------
// TAB COMPONENTS (Server Components)
// --------------------------------------------------------------------------------

async function OverviewTab({ vendor }: { vendor: any }) {
  // Fetch high-level stats just for this vendor
  let rawQuery = sql`
    SELECT 
      COUNT(id) FILTER (WHERE status NOT IN ('delivered', 'cancelled', 'refunded')) AS active_orders,
      COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0) AS lifetime_revenue,
      COUNT(id) FILTER (WHERE status = 'delivered') AS lifetime_orders
    FROM orders 
    WHERE vendor_id = ${vendor.id}
  `;
  // @ts-ignore
  const { rows } = await db.execute(rawQuery);
  const stats = rows[0] || { active_orders: 0, lifetime_revenue: 0, lifetime_orders: 0 };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Stats Column */}
      <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-white/5 rounded-2xl p-6">
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Lifetime Revenue</div>
          <div className="text-3xl font-black">₦{Number(stats.lifetime_revenue).toLocaleString()}</div>
        </div>
        <div className="bg-card border border-white/5 rounded-2xl p-6">
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Lifetime Orders</div>
          <div className="text-3xl font-black">{Number(stats.lifetime_orders).toLocaleString()}</div>
        </div>
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-accent/20 rounded-full blur-2xl group-hover:bg-accent/30 transition-colors" />
          <div className="text-sm font-bold text-accent uppercase tracking-wider mb-2">Active Queue</div>
          <div className="text-4xl font-black text-accent">{String(stats.active_orders || 0)} <span className="text-lg text-accent/50">orders</span></div>
        </div>
        <div className="bg-card border border-white/5 rounded-2xl p-6">
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Queue Status (Live)</div>
          <div className="text-xl font-bold mt-2">
             {vendor.queueStatus && Object.keys(vendor.queueStatus).length > 0 
                ? JSON.stringify(vendor.queueStatus) 
                : 'Accepting Normal Orders'}
          </div>
        </div>
      </div>

      {/* Details Column */}
      <div className="col-span-1 bg-card border border-white/5 rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-6 border-b border-white/5 pb-4">Business Details</h3>
        
        <div className="space-y-4">
          <div>
            <div className="text-xs text-muted-foreground font-bold uppercase mb-1">Tags</div>
            <div className="flex flex-wrap gap-2">
              {(vendor.tags as string[] || []).map((tag: string, i: number) => (
                <span key={i} className="px-2 py-1 bg-white/5 rounded text-xs font-semibold">{tag}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-bold uppercase mb-1">Logistics Params</div>
            <div className="text-sm">Prep Time: <span className="font-bold text-white">{vendor.preparationTime} mins</span></div>
            <div className="text-sm">Distance: <span className="font-bold text-white">{vendor.distance}</span></div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-bold uppercase mb-1">Financials</div>
            <div className="text-sm">Min Order: <span className="font-bold text-white">₦{vendor.minOrder}</span></div>
            {vendor.bankAccount && (
               <div className="mt-2 p-3 bg-black/40 rounded-xl border border-white/5 text-xs font-mono text-muted-foreground">
                 {(vendor.bankAccount as any).bankName} - {(vendor.bankAccount as any).accountNumber}
               </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

async function MenuTab({ vendorId }: { vendorId: string }) {
  // Fetch categories and items
  const allCategories = await db.select().from(categories).where(eq(categories.vendorId, vendorId));
  const allItems = await db.select().from(items).where(eq(items.categoryId, allCategories.map(c => c.id)[0] || '00000000-0000-0000-0000-000000000000')); // Need an IN clause really, but let's just do a join

  const catIds = allCategories.map(c => c.id);
  
  let vendorItems: any[] = [];
  if (catIds.length > 0) {
    // using raw sql for IN clause to keep it simple
    const idList = catIds.map(id => `'${id}'`).join(',');
    const query = sql.raw(`SELECT * FROM items WHERE category_id IN (${idList})`);
    const result = await db.execute(query);
    vendorItems = result.rows;
  }

  // Server Action to toggle availability
  async function toggleItem(itemId: string, currentState: boolean) {
    'use server';
    await db.update(items).set({ isAvailable: !currentState }).where(eq(items.id, itemId));
    revalidatePath(`/vendors/[slug]`, 'page'); // Very powerful Next.js feature
  }

  return (
    <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-bold text-lg">Menu Management</h3>
        <button className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors">
          Add Category
        </button>
      </div>

      {allCategories.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">No menu items configured.</div>
      ) : (
        <div className="divide-y divide-white/5">
          {allCategories.map(category => {
            const catItems = vendorItems.filter(i => i.category_id === category.id);
            return (
              <div key={category.id} className="p-0">
                <div className="px-6 py-4 bg-white/[0.02] font-black text-white">{category.name}</div>
                {catItems.length === 0 ? (
                  <div className="px-6 py-4 text-sm text-muted-foreground italic">Empty category.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {catItems.map(item => (
                      <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                        <div className="flex items-center gap-4">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-white/5" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                          )}
                          <div>
                            <div className="font-bold text-sm flex items-center gap-2">
                              {item.name} 
                              {item.popular && <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-[10px] rounded uppercase">Popular</span>}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">₦{item.price.toLocaleString()} • {item.preparation_time || 15} mins prep</div>
                          </div>
                        </div>
                        
                        <form action={async () => {
                          'use server';
                          await toggleItem(item.id, item.is_available);
                        }}>
                          <button 
                            type="submit"
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              item.is_available 
                                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            }`}
                          >
                            {item.is_available ? 'Available' : 'Sold Out'}
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

async function OrdersTab({ vendorId }: { vendorId: string }) {
  const vendorOrders = await db.select({
    id: orders.id,
    totalAmount: orders.totalAmount,
    status: orders.status,
    createdAt: orders.createdAt,
    userName: users.name,
    userEmail: users.email,
  })
  .from(orders)
  .leftJoin(users, eq(orders.userId, users.id))
  .where(eq(orders.vendorId, vendorId))
  .orderBy(desc(orders.createdAt))
  .limit(50);

  return (
    <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <h3 className="font-bold text-lg">Recent Orders</h3>
        <p className="text-sm text-muted-foreground">Showing the last 50 orders for this vendor.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <th className="p-4 pl-6">Order ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4 pr-6">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {vendorOrders.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No orders found.</td></tr>
            ) : (
              vendorOrders.map(order => (
                <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-4 pl-6 font-mono text-xs text-muted-foreground">#{order.id.split('-')[0]}</td>
                  <td className="p-4">
                    <div className="text-sm font-medium">{order.userName || 'Guest'}</div>
                    <div className="text-xs text-muted-foreground font-normal">{order.userEmail || 'No email provided'}</div>
                  </td>
                  <td className="p-4 font-black">₦{order.totalAmount?.toLocaleString()}</td>
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
                  <td className="p-4 pr-6 text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function SettingsTab({ vendor }: { vendor: any }) {
  // Server Action for extreme status updates
  async function enforceAction(vendorId: string, action: string) {
    'use server';
    if (action === 'ban') {
      await db.update(vendors).set({ status: 'deactivated' }).where(eq(vendors.id, vendorId));
    }
    revalidatePath(`/vendors/[slug]`, 'page');
  }

  return (
    <div className="bg-card border border-red-500/20 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
      </div>
      
      <h3 className="font-bold text-lg text-red-500 mb-2">Danger Zone</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Actions taken here are severe and directly impact the vendor's ability to operate on the LagChow platform.
      </p>

      <div className="space-y-4 max-w-xl">
        
        <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
          <div>
            <h4 className="font-bold text-sm">Send Notification Push</h4>
            <p className="text-xs text-muted-foreground mt-1">Send a direct system alert to the vendor's tablet.</p>
          </div>
          <button className="px-4 py-2 bg-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20 transition-colors">
            Compose
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-black/40 border border-red-500/10 rounded-xl">
          <div>
            <h4 className="font-bold text-sm text-red-400">Deactivate (Ban) Vendor</h4>
            <p className="text-xs text-muted-foreground mt-1">Instantly remove them from the app. All active orders will be cancelled.</p>
          </div>
          <form action={async () => {
            'use server';
            await enforceAction(vendor.id, 'ban');
          }}>
            <button 
              type="submit" 
              disabled={vendor.status === 'deactivated'}
              className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {vendor.status === 'deactivated' ? 'Banned' : 'Ban Vendor'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
