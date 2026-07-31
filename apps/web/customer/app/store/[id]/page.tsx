"use client";
import React, { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useState, useEffect } from 'react';
import { ChevronLeft, Share, Search, MapPin, Clock, Heart, Star, ShoppingBag, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { notFound } from 'next/navigation';

const queueColorMap: Record<string, any> = {
  red: {
    text: 'text-red-500',
    lightText: 'text-red-400',
    bg: 'bg-red-500',
    badgeBg: 'bg-red-500/20',
    badgeBorder: 'border-red-500/30',
    pulse: 'bg-red-400'
  },
  yellow: {
    text: 'text-yellow-500',
    lightText: 'text-yellow-400',
    bg: 'bg-yellow-500',
    badgeBg: 'bg-yellow-500/20',
    badgeBorder: 'border-yellow-500/30',
    pulse: 'bg-yellow-400'
  },
  green: {
    text: 'text-green-500',
    lightText: 'text-green-400',
    bg: 'bg-green-500',
    badgeBg: 'bg-green-500/20',
    badgeBorder: 'border-green-500/30',
    pulse: 'bg-green-400'
  }
};

export default function VendorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, totalItems, totalAmount, setIsCartOpen } = useCart();
  const [now, setNow] = useState(Date.now());
  const [selectedMeal, setSelectedMeal] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    const fetchVendorData = () => {
      fetch(`/api/vendors/${resolvedParams.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.vendor) {
            // Parse rating for frontend
            setVendor({
              ...data.vendor,
              rating: parseFloat(data.vendor.rating)
            });
          }
          setLoading(false);
        })
        .catch(e => {
          console.error(e);
          setLoading(false);
        });
    };

    fetchVendorData(); // Fetch immediately on mount
    
    // Poll every 10 seconds to auto-update stock/queue statuses!
    const pollInterval = setInterval(fetchVendorData, 10000);
    return () => clearInterval(pollInterval);
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    notFound();
  }

  const qColor = queueColorMap[vendor.queueStatus.color] || queueColorMap.yellow;

  return (
    <main className="min-h-screen bg-background text-foreground pb-24 font-sans selection:bg-accent selection:text-black">
      
      {/* 1. VENDOR COVER & HEADER */}
      <div className="relative h-[250px] sm:h-[350px] w-full">
        <Image 
          src={vendor.coverImage} 
          alt={vendor.name} 
          fill 
          className="object-cover"
          priority
        />
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Top Actions */}
        <div className="absolute top-0 w-full p-4 sm:p-6 flex items-center justify-between z-20">
          <Link href="/stores">
            <Button variant="outline" size="icon" className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20 rounded-full w-11 h-11 text-white shadow-lg transition-all active:scale-95">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20 rounded-full w-11 h-11 text-white shadow-lg transition-all active:scale-95">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20 rounded-full w-11 h-11 text-white shadow-lg transition-all active:scale-95">
              <Share className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Vendor Info overlay bottom */}
        <div className="absolute bottom-6 left-0 w-full p-4 sm:p-6 sm:px-8 max-w-7xl mx-auto flex flex-col gap-4 z-20">
          <div className="flex gap-3 mb-1">
            {vendor.tags.map((tag: any) => (
              <Badge key={tag} className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/10 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-xl">{vendor.name}</h1>
          
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 text-accent fill-accent drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
              <span className="font-bold">{vendor.rating}</span> 
              <span className="text-white/70">({vendor.reviews})</span>
            </div>
            <div className={`flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full font-bold ${qColor.lightText}`}>
              <Clock className="w-4 h-4" />
              {vendor.queueStatus.time}
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
              <MapPin className="w-4 h-4" />
              {vendor.distance}
            </div>
            {/* Queue Status Badge moved beside location */}
            <Badge className={`${qColor.badgeBg} ${qColor.lightText} border ${qColor.badgeBorder} px-3 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
              <span className={`w-2 h-2 rounded-full ${qColor.pulse} animate-pulse shadow-[0_0_8px_currentColor]`}></span>
              <span className="font-bold tracking-wide">{vendor.queueStatus.status}</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Floating Glass Info Card */}
        <div className="relative -mt-8 z-30 flex items-center justify-between gap-6 py-5 px-6 bg-card/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-x-auto whitespace-nowrap mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Demand</span>
            <div className={`flex items-center gap-2 font-black text-lg ${qColor.text}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${qColor.bg} animate-pulse shadow-[0_0_10px_currentColor]`}></span>
              {vendor.queueStatus.demand}
            </div>
          </div>
          <div className="w-[1px] h-8 bg-white/10"></div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Delivery</span>
            <span className="font-semibold">{vendor.deliveryFee}</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10"></div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Min. Order</span>
            <span className="font-semibold">{vendor.minOrder}</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10"></div>
          <div className="flex items-center gap-2 text-sm font-semibold text-accent cursor-pointer hover:underline">
            More info & map
          </div>
        </div>

        {/* 2. CATEGORY TABS (Sticky) */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-white/5 py-4 mt-2">
          <ScrollArea className="w-full">
            <div className="flex w-max space-x-2 px-1">
              {vendor.categories.map((cat:any, idx:any) => (
                <Button 
                  key={cat.id} 
                  variant={idx === 0 ? "default" : "outline"} 
                  className={`rounded-full h-10 px-5 font-bold transition-all ${
                    idx === 0 
                    ? "bg-foreground text-background hover:bg-foreground/90" 
                    : "border-white/10 bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>

        {/* 3. MENU ITEMS */}
        <div className="mt-8 space-y-12">
          {vendor.categories.map((category:any) => (
            <div key={category.id} id={category.id} className="scroll-mt-32">
              <h2 className="text-2xl font-black mb-6 tracking-tight flex items-center gap-3">
                {category.name}
                <div className="h-px bg-white/10 flex-1"></div>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {category.items.length === 0 ? (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                    <ShoppingBag className="w-12 h-12 text-white/20 mb-4" />
                    <p className="text-white/60 font-medium">No meals available yet.</p>
                    <p className="text-sm text-white/40 mt-1">Check back later when the vendor uploads new meals!</p>
                  </div>
                ) : (
                  category.items.map((item: any) => {
                    const isHighDemand = vendor.queueStatus?.demand === 'High' || vendor.queueStatus?.demand === 'Very High' || vendor.queueStatus?.status === 'Rush Hour';
                    const activePrepTime = isHighDemand && item.peakPreparationTime ? item.peakPreparationTime : item.preparationTime;
                    
                    const isRestocking = item.isAvailable === false && item.restockTime && new Date(item.restockTime).getTime() > now;
                    let restockingText = "";
                    if (isRestocking) {
                      const diff = new Date(item.restockTime).getTime() - now;
                      const m = Math.floor(diff / 60000);
                      const s = Math.floor((diff % 60000) / 1000);
                      restockingText = `${m}m ${s}s`;
                    }
                    // If restockTime is in the past (timer completed), it falls back to Available!
                    const isUnavailable = item.isAvailable === false && !item.restockTime;

                    return (
                      <Card 
                        key={item.id} 
                        onClick={() => {
                          if (!isUnavailable) setSelectedMeal({ ...item, activePrepTime, isRestocking, restockingText });
                        }}
                        className={`group border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent hover:from-white/[0.08] hover:to-white/[0.02] hover:border-white/20 transition-all duration-300 overflow-hidden rounded-[24px] flex flex-row shadow-xl hover:shadow-[0_10px_40px_rgba(0,0,0,0.3)] relative ${isUnavailable ? 'opacity-50 grayscale pointer-events-none' : 'cursor-pointer'}`}
                      >
                        {/* Item Details */}
                        <div className="flex-1 p-5 flex flex-col justify-between z-10">
                          <div>
                            {item.popular && (
                              <Badge className="bg-accent/20 text-accent hover:bg-accent/30 mb-3 border-none shadow-[0_0_10px_rgba(250,204,21,0.2)]">
                                <Star className="w-3 h-3 mr-1 fill-accent" /> Popular
                              </Badge>
                            )}
                            <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-accent transition-colors">{item.name}</h3>
                            <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">{item.description}</p>
                            
                            {activePrepTime && !isRestocking && !isUnavailable && (
                              <div className="flex items-center gap-2 mt-3 mb-1">
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                <span className="text-xs font-bold text-white/80">Available <span className="text-white/40 font-normal mx-1">•</span> Ready in ~{activePrepTime} mins</span>
                              </div>
                            )}
                            {isRestocking && (
                              <div className="flex items-center gap-2 mt-3 mb-1">
                                <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(250,204,21,0.6)] animate-pulse"></div>
                                <span className="text-xs font-bold text-accent">Preparing <span className="text-accent/60 font-normal mx-1">•</span> Ready in ~<span className="tabular-nums font-mono">{restockingText}</span></span>
                              </div>
                            )}
                            {isUnavailable && (
                              <div className="flex items-center gap-2 mt-3 mb-1">
                                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                                <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Sold Out</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-5 flex items-center justify-between">
                            <span className="font-black text-xl">₦{item.price.toLocaleString()}</span>
                            <Button 
                              size="icon" 
                              disabled={isUnavailable || isRestocking}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addItem({
                                  id: item.id,
                                  name: item.name,
                                  price: item.price,
                                  vendorId: vendor.id,
                                  vendorName: vendor.name,
                                  image: item.image
                                });
                              }}
                              className="h-10 w-10 rounded-full bg-white/5 border border-white/10 text-white group-hover:bg-accent group-hover:border-accent group-hover:text-black group-hover:scale-110 active:scale-95 transition-all shadow-[0_4px_14px_transparent] group-hover:shadow-[0_4px_20px_rgba(250,204,21,0.4)] disabled:opacity-50 disabled:pointer-events-none"
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                        {/* Item Image */}
                        <div className="relative w-[130px] sm:w-[150px] shrink-0 p-3 pl-0 flex items-center z-10">
                          <div className="relative w-full aspect-square rounded-[20px] overflow-hidden shadow-lg group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
                            <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FLOATING VIEW CART BUTTON (Mobile & Desktop) */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none animate-in slide-in-from-bottom-10 fade-in duration-300">
          <Button 
            onClick={() => setIsCartOpen(true)}
            className="pointer-events-auto bg-accent hover:bg-accent/90 text-black font-black h-14 px-8 rounded-full shadow-[0_10px_40px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 w-full max-w-sm"
          >
            <div className="bg-black/10 px-2 py-1 rounded-md text-sm">{totalItems}</div>
            <span className="flex-1 text-center">View Cart</span>
            <span>₦{totalAmount.toLocaleString()}</span>
          </Button>
        </div>
      )}

      {/* Meal Details Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedMeal(null)}>
          <div className="w-full sm:w-[450px] bg-[#111] border border-white/10 sm:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full h-[250px] sm:h-[300px] shrink-0">
              <Image src={selectedMeal.image} alt={selectedMeal.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent"></div>
              <button 
                onClick={() => setSelectedMeal(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white hover:bg-black/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 pt-0 flex-1 overflow-y-auto relative -mt-8 z-10">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-black leading-tight pr-4">{selectedMeal.name}</h2>
                <span className="font-black text-2xl text-accent shrink-0">₦{selectedMeal.price.toLocaleString()}</span>
              </div>
              
              {selectedMeal.rating && (
                <div className="flex items-center gap-1 mb-6 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(selectedMeal.rating) ? 'fill-accent' : 'text-white/20'}`} />
                  ))}
                  <span className="text-white/80 font-medium ml-2 text-sm">{selectedMeal.rating}</span>
                </div>
              )}

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-3 h-3 rounded-full shadow-[0_0_12px_currentColor] ${selectedMeal.isRestocking ? 'bg-accent text-accent animate-pulse' : 'bg-green-500 text-green-500'}`}></div>
                  <h4 className="font-bold text-white uppercase tracking-wider text-xs">Status</h4>
                </div>
                <p className="text-lg font-black mb-1">
                  {selectedMeal.isRestocking ? '🟡 Currently Being Prepared' : '🟢 Available to Order'}
                </p>
                <p className="text-sm font-semibold text-white/60">
                  Estimated Ready Time: <span className="text-white">{selectedMeal.isRestocking ? selectedMeal.restockingText : `${selectedMeal.activePrepTime} minutes`}</span>
                </p>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-white/40 italic">Note: Your order will begin delivery immediately after preparation is complete.</p>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="font-bold mb-2">Description</h4>
                <p className="text-white/60 text-sm leading-relaxed">{selectedMeal.description}</p>
              </div>

            </div>
            
            <div className="p-5 border-t border-white/10 bg-[#111] shrink-0">
              <Button 
                disabled={selectedMeal.isRestocking}
                onClick={() => {
                  addItem({
                    id: selectedMeal.id,
                    name: selectedMeal.name,
                    price: selectedMeal.price,
                    vendorId: vendor.id,
                    vendorName: vendor.name,
                    image: selectedMeal.image
                  });
                  setSelectedMeal(null);
                }}
                className="w-full h-14 bg-accent text-black font-black text-lg rounded-2xl shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {selectedMeal.isRestocking ? 'Still Preparing...' : `Add to Cart - ₦${selectedMeal.price.toLocaleString()}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
