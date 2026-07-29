import React from 'react';
import { db } from '@lagchow/database';
import { deliveryModes } from '@lagchow/database/src/schema';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Server Actions
async function toggleMode(modeId: string, currentState: boolean) {
  'use server';
  await db.update(deliveryModes).set({ isActive: !currentState }).where(eq(deliveryModes.id, modeId));
  revalidatePath('/delivery-modes');
}

async function createMode(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  const maxDistanceKm = parseFloat(formData.get('maxDistanceKm') as string);
  const baseFee = parseInt(formData.get('baseFee') as string, 10);
  
  await db.insert(deliveryModes).values({
    name,
    maxDistanceKm,
    baseFee,
    isActive: true
  });
  revalidatePath('/delivery-modes');
}

export const dynamic = 'force-dynamic';

export default async function DeliveryModesPage() {
  const modes = await db.select().from(deliveryModes).orderBy(desc(deliveryModes.createdAt));

  return (
    <div className="flex flex-col gap-6 max-w-5xl pb-12">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Delivery Modes Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage delivery pricing and distance thresholds for the platform.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Modes List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {modes.length === 0 ? (
            <div className="bg-card border border-white/5 rounded-2xl p-12 text-center text-muted-foreground">
              No delivery modes configured. Create one to get started.
            </div>
          ) : (
            modes.map((mode) => (
              <div key={mode.id} className="bg-card border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group">
                {/* Active Indicator Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${mode.isActive ? 'bg-green-500' : 'bg-white/10'}`} />
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{mode.name}</h3>
                    {!mode.isActive && <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] uppercase font-bold text-white/60">Inactive</span>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs bg-white/5 px-1.5 rounded">Max: {mode.maxDistanceKm}km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs bg-accent/20 text-accent px-1.5 rounded">Base: ₦{mode.baseFee}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <form action={async () => {
                    'use server';
                    await toggleMode(mode.id, mode.isActive as boolean);
                  }}>
                    <button 
                      type="submit"
                      className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${
                        mode.isActive 
                          ? 'bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white' 
                          : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                      }`}
                    >
                      {mode.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </form>
                  <button className="text-xs font-bold px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-white/5 rounded-2xl p-6 sticky top-6">
            <h3 className="font-bold text-lg mb-6 border-b border-white/5 pb-4">New Delivery Mode</h3>
            <form action={createMode} className="flex flex-col gap-4">
              
              <div>
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Mode Name</label>
                <input 
                  required 
                  name="name"
                  type="text" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent" 
                  placeholder="e.g. Campus Walker" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Base Fee (₦)</label>
                <input 
                  required 
                  name="baseFee"
                  type="number" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent" 
                  placeholder="500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Max Distance (km)</label>
                <input 
                  required 
                  name="maxDistanceKm"
                  type="number" 
                  step="0.1"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent" 
                  placeholder="2.5" 
                />
                <p className="text-[10px] text-muted-foreground mt-2">
                  Orders beyond this radius will not be assigned to this mode.
                </p>
              </div>

              <button 
                type="submit"
                className="w-full bg-accent text-black px-4 py-3 rounded-xl font-bold mt-2 hover:scale-[1.02] transition-transform"
              >
                Add Mode
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
