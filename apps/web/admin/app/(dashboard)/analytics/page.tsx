import React from 'react';
import { db } from '@lagchow/database';
import { HeatmapWrapper } from '@/components/heatmap-wrapper';
import { orders } from '@lagchow/database/src/schema';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  
  // In production, you would fetch actual order coordinates here.
  // Example: const allOrders = await db.select({ deliveryAddress: orders.deliveryAddress }).from(orders);
  // and parse lat/lng from the JSON.
  
  // For demonstration of the heat mapping capability, we will cluster points around the primary campus hotspots.
  const generateMockPoints = (centerLat: number, centerLng: number, radius: number, count: number) => {
    return Array.from({ length: count }).map(() => {
      const u = Math.random();
      const v = Math.random();
      const w = radius / 111300; // rough degree conversion
      const t = 2 * Math.PI * v;
      const x = w * Math.cos(t);
      const y = w * Math.sin(t);
      return {
        lat: centerLat + x,
        lng: centerLng + (y / Math.cos(centerLat * Math.PI / 180))
      };
    });
  };

  // UNILAG Coordinates roughly
  const libraryCoords = generateMockPoints(6.5170, 3.3980, 500, 150); // Main Library
  const moremiCoords = generateMockPoints(6.5140, 3.3900, 300, 250); // Moremi Hall (high density)
  const islCoords = generateMockPoints(6.5200, 3.3920, 600, 80); // ISL / Staff Quarters
  
  const allPoints = [...libraryCoords, ...moremiCoords, ...islCoords];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Analytics & Intelligence</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Visualize real-time demand patterns and peak ordering hotspots across the campus.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Data Insights */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 md:col-span-1 flex flex-col justify-between">
           <div>
             <h3 className="font-bold text-lg mb-6 border-b border-white/5 pb-4">Hotspots Overview</h3>
             <div className="space-y-6">
               <div className="flex flex-col gap-1">
                 <div className="flex items-center justify-between">
                   <span className="text-sm font-semibold text-white">Moremi Hall</span>
                   <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded font-black tracking-wider uppercase">Extreme</span>
                 </div>
                 <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
                   <div className="bg-red-500 h-full w-[85%] rounded-full" />
                 </div>
               </div>
               
               <div className="flex flex-col gap-1">
                 <div className="flex items-center justify-between">
                   <span className="text-sm font-semibold text-white">Main Library</span>
                   <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded font-black tracking-wider uppercase">High</span>
                 </div>
                 <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
                   <div className="bg-yellow-500 h-full w-[65%] rounded-full" />
                 </div>
               </div>

               <div className="flex flex-col gap-1">
                 <div className="flex items-center justify-between">
                   <span className="text-sm font-semibold text-white">Staff Quarters</span>
                   <span className="text-[10px] bg-blue-500/20 text-blue-500 px-2 py-1 rounded font-black tracking-wider uppercase">Moderate</span>
                 </div>
                 <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
                   <div className="bg-blue-500 h-full w-[35%] rounded-full" />
                 </div>
               </div>
             </div>
           </div>

           <div className="mt-12 p-6 bg-accent/10 border border-accent/20 rounded-xl relative overflow-hidden">
             <div className="absolute right-0 top-0 w-24 h-24 bg-accent/20 blur-2xl rounded-full" />
             <div className="text-xs text-accent uppercase tracking-widest font-bold mb-2">Peak Ordering Hours</div>
             <div className="text-3xl font-black text-white tracking-tighter">18:00 - 21:00</div>
             <p className="text-xs text-white/60 mt-1">74% of orders occur in this window.</p>
           </div>
        </div>

        {/* Right Column: Maplibre Map */}
        <div className="md:col-span-2 relative group rounded-2xl overflow-hidden border border-white/5">
          <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-xl flex items-center justify-between w-64">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
               <span className="text-xs font-bold uppercase tracking-widest text-white/90">Live Demand Engine</span>
             </div>
          </div>
          
          <div className="absolute bottom-4 right-4 z-10 flex gap-1">
             <div className="w-4 h-4 bg-[rgb(103,169,207)] rounded-full border border-black" />
             <div className="w-4 h-4 bg-[rgb(253,219,199)] rounded-full border border-black" />
             <div className="w-4 h-4 bg-[rgb(239,138,98)] rounded-full border border-black" />
             <div className="w-4 h-4 bg-[rgb(178,24,43)] rounded-full border border-black" />
          </div>

          <HeatmapWrapper ordersData={allPoints} />
        </div>

      </div>
    </div>
  );
}
