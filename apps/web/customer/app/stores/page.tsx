"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

import { Search, MapPin, ChevronDown, Heart, Clock, Settings2, Home, ShoppingBag, User, Flame, Filter, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { AuthModal } from '@/components/auth-modal';
import { useUser } from '@/hooks/use-user';
import { DeliveryAddressModal } from '@/components/delivery-address-modal';

const queueColorMap: Record<string, any> = {
  red: { text: 'text-red-500', bg: 'bg-red-500', badgeBg: 'bg-red-500/10' },
  yellow: { text: 'text-yellow-500', bg: 'bg-yellow-500', badgeBg: 'bg-yellow-500/10' },
  green: { text: 'text-green-500', bg: 'bg-green-500', badgeBg: 'bg-green-500/10' }
};

export default function HomePage() {
  const { totalItems, setIsCartOpen, deliveryLocation: activeAddress, setDeliveryLocation: setActiveAddress } = useCart();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const { user, loading } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [savedVendorIds, setSavedVendorIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [vendors, setVendors] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  useEffect(() => {
    if (user) {
      if (user.location) {
        setActiveAddress(user.location);
      }
      fetch('/api/saved')
        .then(res => res.json())
        .then(data => {
          if (data.saved) setSavedVendorIds(data.saved);
        });
    }
  }, [user]);

  useEffect(() => {
    fetch('/api/vendors')
      .then(res => res.json())
      .then(data => {
        if (data.vendors) {
          // Parse rating back to number for the frontend
          const parsedVendors = data.vendors.map((v: any) => ({
            ...v,
            rating: parseFloat(v.rating)
          }));
          setVendors(parsedVendors);
        }
        setLoadingVendors(false);
      })
      .catch(e => {
        console.error(e);
        setLoadingVendors(false);
      });
  }, []);

  const toggleSave = async (e: React.MouseEvent, vendorId: string) => {
    e.preventDefault(); // prevent navigation
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    
    // Optimistic update
    const isCurrentlySaved = savedVendorIds.includes(vendorId);
    setSavedVendorIds(prev => 
      isCurrentlySaved ? prev.filter(id => id !== vendorId) : [...prev, vendorId]
    );
    setIsSaving(prev => ({ ...prev, [vendorId]: true }));

    try {
      const res = await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId })
      });
      if (!res.ok) throw new Error('Failed');
    } catch (error) {
      // Revert optimistic update on failure
      setSavedVendorIds(prev => 
        isCurrentlySaved ? [...prev, vendorId] : prev.filter(id => id !== vendorId)
      );
    } finally {
      setIsSaving(prev => ({ ...prev, [vendorId]: false }));
    }
  };

  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-background text-foreground pb-24 font-sans selection:bg-accent selection:text-black">
      
      {/* HEADER SECTION (Desktop & Mobile) */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          
          {/* Left: Brand & Location */}
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black tracking-tighter text-accent hidden md:block">LagChow<span className="text-foreground">.</span></h1>
            
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors"
              onClick={() => setIsDeliveryModalOpen(true)}
            >
              <div className="p-2 bg-accent/20 text-accent rounded-full">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-semibold tracking-wide uppercase">Deliver to</span>
                <span className="text-sm font-bold truncate max-w-[150px] sm:max-w-[200px] text-foreground">{activeAddress.split(',')[0]}</span>
                <div className="md:hidden relative mt-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search for food..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus-visible:ring-accent"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Middle: Search Bar (Desktop) */}
          <div className="flex-1 max-w-xl mx-8 hidden md:block relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search for food, drinks, groceries etc..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus-visible:ring-accent"
            />
            <Button className="absolute right-1 top-1 h-10 rounded-xl bg-accent hover:bg-accent/90 text-black font-bold px-6">
              Search
            </Button>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="md:hidden text-foreground">
              <Search className="w-5 h-5" />
            </Button>
            
            <Link href="/saved">
              <Button variant="outline" className="hidden sm:flex items-center gap-2 border-white/10 hover:bg-white/5 rounded-xl h-12 px-4">
                <Heart className={`w-4 h-4 ${savedVendorIds.length > 0 ? 'fill-accent text-accent' : ''}`} />
                <span className="font-semibold text-sm">Saved {savedVendorIds.length > 0 && `(${savedVendorIds.length})`}</span>
              </Button>
            </Link>

            <Button 
              variant="outline" 
              onClick={() => setIsCartOpen(true)}
              className="hidden sm:flex items-center gap-2 border-white/10 hover:bg-white/5 rounded-xl h-12 px-4 relative"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-semibold text-sm">{totalItems} items</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                </span>
              )}
            </Button>
            
            {/* Login / Profile */}
            <div className="hidden sm:block">
              {loading ? (
                <div className="w-24 h-12 bg-white/5 rounded-xl animate-pulse" />
              ) : user ? (
                <Link href="/profile">
                  <Button variant="ghost" className="hover:bg-white/10 rounded-xl h-12 px-4 flex items-center gap-3">
                    <Avatar className="h-8 w-8 ring-2 ring-accent">
                      <AvatarFallback className="bg-red-500 text-white font-bold text-xs">
                        {user.name ? (user.name.trim().split(' ').length >= 2 ? (user.name.trim().split(' ')[0][0] + user.name.trim().split(' ')[1][0]) : user.name.trim().substring(0, 2)).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm truncate max-w-[100px]">{user.name?.split(' ')[0] || 'Profile'}</span>
                  </Button>
                </Link>
              ) : (
                <Button onClick={() => setIsAuthModalOpen(true)} className="bg-accent hover:bg-accent/90 text-black font-bold rounded-xl h-12 px-6">
                  <User className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
            </div>

            {/* Mobile Profile Avatar */}
            <div className="relative sm:hidden">
              {loading ? (
                <div className="w-10 h-10 bg-white/5 rounded-full animate-pulse" />
              ) : user ? (
                <Link href="/profile">
                  <Avatar className="h-10 w-10 ring-2 ring-accent hover:ring-white transition-all cursor-pointer">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name || 'User'}`} />
                    <AvatarFallback className="bg-accent text-black font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <div onClick={() => setIsAuthModalOpen(true)}>
                  <Avatar className="h-10 w-10 ring-2 ring-white/10 hover:ring-accent transition-all cursor-pointer">
                    <AvatarFallback className="bg-card text-foreground font-semibold"><User className="w-5 h-5"/></AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 mt-6">
        
        {/* QUICK FILTERS */}
        <section className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full border-white/10 hover:bg-white/5 text-foreground h-10 px-4 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="font-semibold text-sm">All Filters</span>
          </Button>
          <ScrollArea className="flex-1 whitespace-nowrap">
            <div className="flex w-max space-x-2">
              {[
                { label: 'Discounts', icon: '🏷️' },
                { label: 'Delivery fee', icon: '🛵', hasDropdown: true },
                { label: 'Open now', icon: '⏰' },
                { label: 'Pickup', icon: '🛍️' },
                { label: 'Ratings', icon: '⭐', hasDropdown: true },
                { label: 'Under 30 mins', icon: '⏳' },
              ].map((filter) => (
                <Button 
                  key={filter.label} 
                  variant="outline"
                  className="rounded-full border-white/5 bg-card hover:bg-white/10 text-muted-foreground hover:text-foreground h-10 px-4 flex items-center gap-2 transition-colors"
                >
                  <span className="text-sm">{filter.icon}</span>
                  <span className="font-semibold text-sm">{filter.label}</span>
                  {filter.hasDropdown && <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </section>

        {/* FEATURED / HERO PROMO SECTION */}
        <section className="relative overflow-hidden rounded-3xl bg-card border border-white/5 text-white p-8 sm:p-12 shadow-2xl min-h-[200px] flex items-center">
          {/* Abstract background shapes */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl opacity-30 mix-blend-screen pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-accent/40 rounded-full blur-[80px]"></div>
            <div className="absolute top-20 right-20 w-80 h-80 bg-accent/10 rounded-full blur-[100px]"></div>
          </div>
          
          <div className="relative z-10 max-w-xl">
            <Badge className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 mb-4 px-3 py-1 text-xs uppercase font-bold tracking-wider">
              Limited Time
            </Badge>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-2 tracking-tight text-white">
              🎉 Launch <span className="text-accent">Offer</span>
            </h2>
            <p className="text-neutral-300 text-sm sm:text-base mt-2 max-w-md">
              No Service Fee on orders below ₦2,000. <br/> Available for our first 200 completed orders.
            </p>
            <Button className="mt-6 bg-accent hover:bg-accent/90 text-black font-bold rounded-xl h-12 px-8 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
              Order Now
            </Button>
          </div>
        </section>

        {/* ALL STORES / FOOD FEED */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black tracking-tight">All Stores</h2>
          </div>
          
          {loadingVendors ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No vendors found</h3>
              <p className="text-muted-foreground">We couldn't find anything matching "{searchQuery}"</p>
              <Button variant="outline" className="mt-6 rounded-xl border-white/10" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredVendors.map((vendor) => {
                const qColor = queueColorMap[vendor.queueStatus.color] || queueColorMap.yellow;
                return (
                  <Link key={vendor.id} href={`/store/${vendor.id}`}>
                    <Card className="p-0 border border-white/5 shadow-xl overflow-hidden rounded-[20px] bg-card group cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] duration-300 h-full flex flex-col">
                      <div className="relative h-[180px] w-full bg-muted shrink-0">
                        <Image src={vendor.coverImage} alt={vendor.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                        <button 
                          onClick={(e) => toggleSave(e, vendor.id)}
                          disabled={isSaving[vendor.id]}
                          className={`absolute top-3 right-3 backdrop-blur-md border border-white/10 p-2 rounded-full flex items-center justify-center transition-all shadow-sm ${
                            savedVendorIds.includes(vendor.id) 
                              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                              : 'bg-black/60 text-white hover:text-accent hover:bg-black/80'
                          } ${isSaving[vendor.id] ? 'opacity-50' : 'opacity-100'}`}
                        >
                          <Heart className={`w-4 h-4 ${savedVendorIds.includes(vendor.id) ? 'fill-current' : ''}`} />
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
        </section>
      </div>

      {/* MOBILE BOTTOM NAVIGATION (Hidden on Desktop) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-card/90 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex justify-between items-center z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center gap-1 text-accent cursor-pointer">
          <Home className="w-6 h-6" strokeWidth={2.5} />
          <span className="text-[10px] font-bold">Home</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <Search className="w-6 h-6" strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Browse</span>
        </div>
        <div className="relative -top-6">
          <div 
            onClick={() => setIsCartOpen(true)}
            className="w-14 h-14 bg-accent rounded-full flex items-center justify-center text-black shadow-[0_10px_20px_rgba(250,204,21,0.3)] cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <ShoppingBag className="w-6 h-6" strokeWidth={2.5} />
            {totalItems > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white border-2 border-[#111111] text-[10px] font-black flex items-center justify-center rounded-full shadow-sm">
                {totalItems}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <Heart className="w-6 h-6" strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Favorites</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <User className="w-6 h-6" strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Profile</span>
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <DeliveryAddressModal 
        isOpen={isDeliveryModalOpen} 
        onClose={() => setIsDeliveryModalOpen(false)} 
        activeAddress={activeAddress}
        onSelectAddress={setActiveAddress}
      />
    </main>
  );
}
