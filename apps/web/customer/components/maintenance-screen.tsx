'use client';
import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export function MaintenanceScreen() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center max-w-md">
        <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-accent" />
        </div>
        
        <h1 className="text-3xl font-black tracking-tight text-white mb-3">
          We're taking a quick breather.
        </h1>
        
        <p className="text-white/60 mb-8 leading-relaxed">
          LagChow is currently offline for scheduled maintenance and upgrades to serve you better. We'll be back online shortly.
        </p>

        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-bold transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Check Again
        </button>
      </div>
    </div>
  );
}
