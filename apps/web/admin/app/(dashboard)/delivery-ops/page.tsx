"use client";

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { AlertCircle, Clock, Navigation, CheckCircle2, Bike, Store, MapPin, Search, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function DeliveryOpsPage() {
  const [pool, setPool] = useState<any[]>([]);
  const [active, setActive] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Ref for audio to avoid re-renders
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for alerts
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // A standard notification ping
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/delivery-ops');
      setPool(res.data.deliveryPool);
      setActive(res.data.activeDeliveries);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Calculate SLA Breaches (> 5 minutes unassigned)
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
  const slaBreaches = pool.filter(order => new Date(order.createdAt) < fiveMinsAgo);

  useEffect(() => {
    // Play audio alert if there are SLA breaches
    if (slaBreaches.length > 0 && audioRef.current) {
      // Play but catch the promise to handle browser autoplay policies
      audioRef.current.play().catch(e => console.log('Audio blocked by browser:', e));
    }
  }, [slaBreaches.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Navigation className="w-8 h-8 text-accent" />
          Delivery Operations
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Live monitoring of all delivery workflows, unassigned orders, and SLA breaches.
        </p>
      </div>

      {/* SLA Breach Alerts */}
      {slaBreaches.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-500">Critical SLA Breaches</h2>
              <p className="text-sm text-red-500/80">{slaBreaches.length} order(s) unassigned for over 5 minutes!</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slaBreaches.map(order => (
              <div key={order.id} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm">₦{order.totalAmount.toLocaleString()}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                    Waiting {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)}m
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">From: <span className="text-white font-semibold">{order.vendor?.name}</span></p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs bg-red-500 hover:bg-red-600 text-white border-0 w-full">
                    Call Vendor
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Delivery Pool (Unassigned) */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Delivery Pool 
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-muted-foreground">
                {pool.length} Unassigned
              </span>
            </h3>
          </div>
          
          {pool.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-white/[0.02] rounded-xl border border-white/5 border-dashed">
              <CheckCircle2 className="w-10 h-10 mb-2 opacity-20" />
              <p>Pool is empty.</p>
              <p className="text-xs mt-1">All ready orders are assigned to riders.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {pool.map(order => (
                <div key={order.id} className={`p-4 rounded-xl border ${new Date(order.createdAt) < fiveMinsAgo ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Order #{order.id.split('-')[0]}</span>
                    <span className="text-xs font-bold text-yellow-500">{order.status}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{order.vendor?.name}</p>
                      <p className="text-[10px] text-muted-foreground">Waiting {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)}m</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Deliveries */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Bike className="w-5 h-5 text-accent" />
              Live Deliveries
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-muted-foreground">
                {active.length} Active
              </span>
            </h3>
          </div>
          
          {active.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-white/[0.02] rounded-xl border border-white/5 border-dashed">
              <Bike className="w-10 h-10 mb-2 opacity-20" />
              <p>No active deliveries.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {active.map(order => (
                <div key={order.id} className="p-4 rounded-xl border border-white/10 bg-black/40">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent text-[10px] uppercase">
                        {order.rider?.name?.substring(0, 2)}
                      </div>
                      <span className="font-bold text-sm">{order.rider?.name}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded">
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -z-10" />
                    
                    <div className="flex flex-col items-center gap-1 bg-black px-2">
                      <div className={`w-3 h-3 rounded-full ${order.status !== 'pending' ? 'bg-accent' : 'bg-white/20'}`} />
                      <span className="text-[8px] text-muted-foreground uppercase">Accepted</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 bg-black px-2">
                      <div className={`w-3 h-3 rounded-full ${['out_for_delivery', 'arrived', 'delivered'].includes(order.status) ? 'bg-accent' : 'bg-white/20'}`} />
                      <span className="text-[8px] text-muted-foreground uppercase">Picked Up</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 bg-black px-2">
                      <div className={`w-3 h-3 rounded-full ${order.status === 'delivered' ? 'bg-accent' : 'bg-white/20'}`} />
                      <span className="text-[8px] text-muted-foreground uppercase">Delivered</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Store className="w-3 h-3" /> {order.vendor?.name}</span>
                    <span className="flex items-center gap-1 text-right text-white"><MapPin className="w-3 h-3 text-red-400" /> {order.deliveryAddress?.hall}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
