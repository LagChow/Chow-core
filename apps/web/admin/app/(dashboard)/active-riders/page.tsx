import React from 'react';
import { db } from '@lagchow/database';
import { riders } from '@lagchow/database/src/schema';
import { eq, sql } from 'drizzle-orm';
import { Bike, MapPin, Wifi, WifiOff } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ActiveRidersPage() {

  const allRiders = await db.select().from(riders).orderBy(riders.status);

  const activeRiders = allRiders.filter(r => r.status === 'active');
  const offlineRiders = allRiders.filter(r => r.status === 'offline');
  const pendingRiders = allRiders.filter(r => r.status === 'pending');

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Bike className="w-8 h-8 text-green-500" />
            Active Riders
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Real-time status and last known location of all campus runners.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm font-bold">
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400">{activeRiders.length} Online</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            <div className="w-2 h-2 bg-gray-500 rounded-full" />
            <span className="text-muted-foreground">{offlineRiders.length} Offline</span>
          </div>
        </div>
      </div>

      {/* Active Riders Grid */}
      {activeRiders.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-green-400 mb-4">Currently Online</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRiders.map((rider) => (
              <div key={rider.id} className="bg-card border border-green-500/10 rounded-2xl p-5 relative overflow-hidden group hover:border-green-500/30 transition-colors">
                <div className="absolute top-3 right-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-black text-lg uppercase">
                    {rider.name.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{rider.name}</h4>
                    <span className="text-xs text-muted-foreground">{rider.phone}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Vehicle</span>
                    <span className="font-bold capitalize px-2 py-0.5 bg-white/5 rounded text-xs">{rider.vehicleType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Location
                    </span>
                    <span className="font-bold text-xs">
                      {rider.currentLat && rider.currentLng
                        ? `${rider.currentLat.toFixed(4)}, ${rider.currentLng.toFixed(4)}`
                        : 'Awaiting GPS'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-green-400 font-bold flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Live
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Since {new Date(rider.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline Riders */}
      {offlineRiders.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 mt-4">Offline</h3>
          <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {offlineRiders.map((rider) => (
                <div key={rider.id} className="p-4 px-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground font-bold uppercase">
                      {rider.name.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white/60">{rider.name}</h4>
                      <span className="text-xs text-muted-foreground capitalize">{rider.vehicleType}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-xs font-semibold">Last seen {new Date(rider.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending */}
      {pendingRiders.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-4 mt-4">Pending Approval</h3>
          <div className="bg-card border border-yellow-500/10 rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {pendingRiders.map((rider) => (
                <div key={rider.id} className="p-4 px-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400 font-bold uppercase">
                      {rider.name.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold">{rider.name}</h4>
                      <span className="text-xs text-muted-foreground">{rider.email}</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-black uppercase rounded tracking-wider">Pending</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {allRiders.length === 0 && (
        <div className="bg-card border border-white/5 rounded-2xl p-12 text-center text-muted-foreground">
          No riders registered yet.
        </div>
      )}
    </div>
  );
}
