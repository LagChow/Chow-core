"use client";

import dynamic from 'next/dynamic';

const DemandHeatmap = dynamic(
  () => import('./demand-heatmap').then(mod => ({ default: mod.DemandHeatmap })),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: '100%', height: '500px', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}>
        Loading Map...
      </div>
    ),
  }
);

export function HeatmapWrapper({ ordersData }: { ordersData: { lat: number; lng: number }[] }) {
  return <DemandHeatmap ordersData={ordersData} />;
}
