"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Bike, LogOut, Loader2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeliveryPool } from '@/components/rider/delivery-pool';
import { ActiveDelivery } from '@/components/rider/active-delivery';

function getCurrentCoords(): Promise<{ currentLat?: number; currentLng?: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return resolve({});
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ currentLat: pos.coords.latitude, currentLng: pos.coords.longitude }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 3500, maximumAge: 15000 }
    );
  });
}

export default function RiderDashboard() {
  const router = useRouter();
  const [rider, setRider] = useState<any>(null);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [pool, setPool] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  const isOnline = rider?.status === 'online' || rider?.status === 'active';

  const fetchState = async () => {
    try {
      // 1. Fetch Rider Profile
      const riderRes = await axios.get('/api/riders/status');
      setRider(riderRes.data);

      // 2. Fetch Deliveries
      const online = riderRes.data?.status === 'online' || riderRes.data?.status === 'active';
      if (online) {
        const delRes = await axios.get('/api/deliveries');
        setActiveDelivery(delRes.data.activeDelivery);
        setPool(delRes.data.availableDeliveries || []);
      } else {
        setActiveDelivery(null);
        setPool([]);
      }
    } catch (e: any) {
      if (e.response?.status === 401) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = localStorage.getItem('riderId');
    if (!id) {
      router.replace('/login');
      return;
    }
    fetchState();

    // Polling every 10 seconds for new deliveries
    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, [router]);

  // Periodically sync rider GPS coordinates while online
  useEffect(() => {
    if (!rider?.id || !isOnline) return;
    const syncGps = async () => {
      const coords = await getCurrentCoords();
      if (coords.currentLat !== undefined && coords.currentLng !== undefined) {
        axios.patch('/api/riders/status', {
          status: 'online',
          ...coords,
        }).catch(() => { });
      }
    };
    syncGps();
    const gpsInterval = setInterval(syncGps, 30000);
    return () => clearInterval(gpsInterval);
  }, [rider?.id, isOnline]);

  const toggleStatus = async () => {
    setStatusLoading(true);
    const newStatus = isOnline ? 'offline' : 'online';
    try {
      const coords = newStatus === 'online' ? await getCurrentCoords() : {};
      await axios.patch('/api/riders/status', { status: newStatus, ...coords });
      setRider({ ...rider, status: newStatus, ...coords });
      if (newStatus === 'offline') {
        setActiveDelivery(null);
        setPool([]);
      } else {
        fetchState();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('riderId');
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-sans selection:bg-accent selection:text-black">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-white/5 shadow-2xl">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
              <Bike className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight leading-none">Rider Portal</h1>
              <p className="text-[10px] text-muted-foreground font-bold tracking-wider mt-0.5">LagChow</p>
            </div>
          </div>

          <Button onClick={handleLogout} variant="ghost" size="icon" className="text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-full">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">

        {/* Status Toggle */}
        <div className="bg-card/50 backdrop-blur-xl border border-white/5 p-4 rounded-3xl flex items-center justify-between shadow-lg">
          <div>
            <h2 className="font-bold text-lg">{rider?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isOnline ? 'Online & Ready' : 'Offline'}
              </p>
            </div>
          </div>

          <Button
            onClick={toggleStatus}
            disabled={statusLoading || activeDelivery}
            variant="outline"
            className={`rounded-2xl h-12 px-6 font-bold transition-all ${isOnline
                ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
              }`}
          >
            {statusLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isOnline ? 'Go Offline' : 'Go Online')}
          </Button>
        </div>

        {/* Main Content Area */}
        {!isOnline ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Navigation className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-2xl font-black mb-2">You are Offline</h2>
            <p className="text-muted-foreground">Go online to start receiving delivery requests and earning.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeDelivery ? (
              <div className="space-y-3">
                <h2 className="font-black text-xl">Current Mission</h2>
                <ActiveDelivery order={activeDelivery} onUpdate={fetchState} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-xl">Delivery Pool</h2>
                  <span className="bg-accent/20 text-accent text-xs font-bold px-2 py-1 rounded-lg">
                    {pool.length} Available
                  </span>
                </div>
                <DeliveryPool deliveries={pool} onClaimSuccess={fetchState} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

