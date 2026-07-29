"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ArrowLeft, Clock, Star, Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';

import { useRouter } from 'next/navigation';

const queueColorMap: Record<string, any> = {
  red: { text: 'text-red-500', bg: 'bg-red-500', badgeBg: 'bg-red-500/10' },
  yellow: { text: 'text-yellow-500', bg: 'bg-yellow-500', badgeBg: 'bg-yellow-500/10' },
  green: { text: 'text-green-500', bg: 'bg-green-500', badgeBg: 'bg-green-500/10' },
};

export default function SavedPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [savedVendorIds, setSavedVendorIds] = useState<string[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user) {
      Promise.all([
        fetch('/api/saved').then(res => res.json()),
        fetch('/api/vendors').then(res => res.json())
      ])
        .then(([savedData, vendorsData]) => {
          if (savedData.saved) setSavedVendorIds(savedData.saved);
          if (vendorsData.vendors) {
            setVendors(vendorsData.vendors.map((v: any) => ({
              ...v,
              rating: parseFloat(v.rating)
            })));
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const toggleSave = async (e: React.MouseEvent, vendorId: string) => {
    e.preventDefault(); // prevent navigation
    
    // Optimistic update
    setSavedVendorIds(prev => prev.filter(id => id !== vendorId));

    try {
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId })
      });
    } catch (error) {
      // Revert if failed
      setSavedVendorIds(prev => [...prev, vendorId]);
    }
  };

  const savedVendors = vendors.filter(v => savedVendorIds.includes(v.id));

  if (userLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading saved stores...</p>
      </div>
    );
  }

  if (!user) return null; // Handled by useEffect redirect

  return (
    <main className="min-h-screen bg-background text-foreground pb-24 font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-white/5">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Heart className="w-5 h-5 fill-accent text-accent" />
              Saved Stores
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {savedVendors.length === 0 ? (
          <div className="text-center py-32 bg-white/5 rounded-3xl border border-white/10 mt-8">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-black mb-3">No saved stores yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Tap the heart icon on any store to save it to your favourites for quick access later.
            </p>
            <Link href="/">
              <Button className="bg-accent hover:bg-accent/90 text-black font-bold h-12 px-8 rounded-xl">
                <Store className="w-4 h-4 mr-2" />
                Discover Stores
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {savedVendors.map((vendor) => {
              const qColor = queueColorMap[vendor.queueStatus.color] || queueColorMap.yellow;
              return (
                <Link key={vendor.id} href={`/store/${vendor.id}`}>
                  <Card className="p-0 border border-white/5 shadow-xl overflow-hidden rounded-[20px] bg-card group cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] duration-300 h-full flex flex-col">
                    <div className="relative h-[180px] w-full bg-muted shrink-0">
                      <Image src={vendor.coverImage} alt={vendor.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      <button 
                        onClick={(e) => toggleSave(e, vendor.id)}
                        className="absolute top-3 right-3 bg-red-500/20 backdrop-blur-md border border-white/10 p-2 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/30 transition-all shadow-sm"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                    <CardContent className="p-4 flex flex-col justify-between flex-1">
                      <div className="flex justify-between items-start">
                        <div className="w-full">
                          <h4 className="font-bold text-base text-foreground leading-tight truncate pr-2">{vendor.name}</h4>
                          <div className="flex items-center gap-2 mt-2 w-full flex-wrap">
                            <div className="flex items-center gap-1 bg-accent/10 text-accent px-2 py-0.5 rounded-md shrink-0">
                              <span className="text-xs font-bold">{vendor.minOrder}</span>
                            </div>
                            <span className={`text-xs font-black flex items-center gap-1.5 ${qColor.badgeBg} ${qColor.text} px-2 py-0.5 rounded-md`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${qColor.bg} animate-pulse shadow-[0_0_5px_currentColor]`}></span>
                              {vendor.queueStatus.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-muted-foreground">
                        <span className="text-accent">★</span> {vendor.rating} ({vendor.reviews})
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
