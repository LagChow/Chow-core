"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useUser } from '@/hooks/use-user';
import { AuthModal } from '@/components/auth-modal';
import { DeliveryAddressModal } from '@/components/delivery-address-modal';
import { MapPin, ArrowLeft, ShieldCheck, Wallet, CreditCard, Banknote, Navigation, Info, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const CAMPUS_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "New Hall": { lat: 6.5173, lng: 3.3912 },
  "Moremi Hall": { lat: 6.5165, lng: 3.3934 },
  "Jaja Hall": { lat: 6.5142, lng: 3.3975 },
  "Mariere Hall": { lat: 6.5150, lng: 3.3958 },
  "Eni Njoku Hall": { lat: 6.5180, lng: 3.3905 },
  "Sodeinde Hall": { lat: 6.5185, lng: 3.3895 },
  "Makama Bida Hall": { lat: 6.5168, lng: 3.3920 },
  "Fagunwa Hall": { lat: 6.5155, lng: 3.3940 },
  "Kofo Ademola Hall": { lat: 6.5160, lng: 3.3930 },
  "Amina Hall": { lat: 6.5120, lng: 3.3880 },
  "Biobaku Hall": { lat: 6.5135, lng: 3.3875 },
  "El Kanemi Hall": { lat: 6.5178, lng: 3.3918 },
  "Honours Hall": { lat: 6.5162, lng: 3.3925 },
  "Queen Amina Hall": { lat: 6.5120, lng: 3.3880 },
  "Success Hall": { lat: 6.5190, lng: 3.3860 },
  "Default": { lat: 6.5158, lng: 3.3898 }, // UNILAG Senate Building / Center
};

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, deliveryLocation, setDeliveryLocation, clearCart } = useCart();
  const { user, loading: userLoading } = useUser();
  
  const [roomNumber, setRoomNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  
  // Delivery Engine States
  const [deliveryModes, setDeliveryModes] = useState<any[]>([]);
  const [selectedMode, setSelectedMode] = useState<any | null>(null);
  const [vendorDetails, setVendorDetails] = useState<Record<string, any>>({});
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(0);

  // Sync user's default hostel to deliveryLocation if not modified yet
  React.useEffect(() => {
    if (user?.hallOfResidence && deliveryLocation === "New Hall (Eni-Njoku)") {
      setDeliveryLocation(`${user.hallOfResidence}${user.landmark ? ` (${user.landmark})` : ''}`);
    }
  }, [user]);

  // Fetch Delivery Modes & Vendor Coordinates
  React.useEffect(() => {
    async function loadLogistics() {
      try {
        const modesRes = await fetch('/api/delivery-modes');
        if (modesRes.ok) {
          const modes = await modesRes.json();
          setDeliveryModes(modes);
        }

        const uniqueVIds = Array.from(new Set(items.map(i => i.vendorId)));
        const vMap: Record<string, any> = {};
        for (const vid of uniqueVIds) {
          const vRes = await fetch(`/api/vendors/${vid}`);
          if (vRes.ok) {
            const payload = await vRes.json();
            vMap[vid] = payload.vendor || payload;
          }
        }
        setVendorDetails(vMap);
      } catch (err) {
        console.error("Failed to load logistics data", err);
      }
    }
    if (items.length > 0) loadLogistics();
  }, [items]);

  // Calculate Distance and auto-select Delivery Mode
  React.useEffect(() => {
    if (deliveryModes.length === 0 || Object.keys(vendorDetails).length === 0) return;

    // Resolve user coordinates
    let userLat = user?.lat;
    let userLng = user?.lng;

    if (!userLat || !userLng) {
      // Fallback to matching Hall string
      const matchedHall = Object.keys(CAMPUS_COORDINATES).find(h => deliveryLocation.includes(h));
      const fallback = matchedHall ? CAMPUS_COORDINATES[matchedHall] : CAMPUS_COORDINATES["Default"];
      userLat = fallback.lat;
      userLng = fallback.lng;
    }

    // Find max distance across all cart vendors
    let maxDist = 0.5; // minimum default 500m
    Object.values(vendorDetails).forEach((v: any) => {
      if (v.lat && v.lng && userLat && userLng) {
        const dist = getDistanceFromLatLonInKm(userLat, userLng, v.lat, v.lng);
        if (dist > maxDist) maxDist = dist;
      }
    });

    setMaxDistanceKm(Number(maxDist.toFixed(2)));

    // Filter eligible modes (where mode's maxDistanceKm >= calculated distance)
    // Modes are sorted by baseFee ascending from the API
    const eligibleModes = deliveryModes.filter(m => m.maxDistanceKm >= maxDist);
    if (eligibleModes.length > 0) {
      setSelectedMode(eligibleModes[0]); // Pick cheapest eligible mode
    } else {
      // If distance exceeds all thresholds, pick the highest capacity mode
      setSelectedMode(deliveryModes[deliveryModes.length - 1]);
    }
  }, [deliveryModes, vendorDetails, deliveryLocation, user]);

  // Group items by vendor
  const vendorGroups = items.reduce((groups, item) => {
    const vId = item.vendorId;
    if (!groups[vId]) {
      groups[vId] = {
        vendorName: item.vendorName,
        items: []
      };
    }
    groups[vId].items.push(item);
    return groups;
  }, {} as Record<string, { vendorName: string; items: typeof items }>);

  const vendorCount = Object.keys(vendorGroups).length;
  const baseDeliveryFee = selectedMode ? selectedMode.baseFee : 300; 
  const totalDeliveryFee = baseDeliveryFee * Math.max(1, vendorCount);
  
  // Dynamic Convenience Fee Logic
  const getConvenienceFee = (subtotal: number) => {
    if (subtotal === 0) return 0;
    if (subtotal < 2000) return 100;
    if (subtotal < 5000) return 150;
    const rawFee = Math.round(subtotal * 0.05);
    return Math.min(500, rawFee); // Cap at ₦500 max!
  };

  const serviceFee = getConvenienceFee(totalAmount); 
  const grandTotal = totalAmount + totalDeliveryFee + serviceFee;

  if (!userLoading && items.length === 0 && !isSubmitting) {
    router.push('/');
    return null;
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auth Gate
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    setIsSubmitting(true);
    
    // Resolve coordinates to attach to the order
    let resolvedLat = user?.lat;
    let resolvedLng = user?.lng;
    if (!resolvedLat || !resolvedLng) {
      const matchedHall = Object.keys(CAMPUS_COORDINATES).find(h => deliveryLocation.includes(h));
      const fallback = matchedHall ? CAMPUS_COORDINATES[matchedHall] : CAMPUS_COORDINATES["Default"];
      resolvedLat = fallback.lat;
      resolvedLng = fallback.lng;
    }

    try {
      const createdOrderIds: string[] = [];

      // Loop through each vendor group and create a separate order in the database
      for (const [vendorId, group] of Object.entries(vendorGroups)) {
        const vTotalAmount = group.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const vConvenienceFee = getConvenienceFee(vTotalAmount);

        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId,
            items: group.items,
            totalAmount: vTotalAmount,
            deliveryFee: baseDeliveryFee,
            convenienceFee: vConvenienceFee,
            deliveryModeId: selectedMode?.id || null,
            deliveryLat: resolvedLat,
            deliveryLng: resolvedLng,
            deliveryAddress: {
              location: deliveryLocation,
              room: roomNumber,
            },
            notes,
            paymentMethod
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to place order');
        }

        const newOrder = await res.json();
        createdOrderIds.push(newOrder.id);
      }

      // If user chose online payment (Bank Transfer or Card), initialize Monnify gateway
      if (paymentMethod === 'transfer' || paymentMethod === 'card') {
        try {
          const payInitRes = await fetch('/api/payments/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderIds: createdOrderIds }),
          });

          if (payInitRes.ok) {
            const payData = await payInitRes.json();
            if (payData.checkoutUrl) {
              clearCart();
              window.location.href = payData.checkoutUrl;
              return;
            }
          } else {
            const errData = await payInitRes.json();
            console.error("Monnify init error:", errData);
          }
        } catch (payErr) {
          console.error("Failed to initialize Monnify payment:", payErr);
        }
      }

      // Clear cart before redirecting to order tracking
      clearCart();

      // Redirect to the tracking page of the first created order (or orders list if multiple)
      if (createdOrderIds.length === 1) {
        router.push(`/orders/${createdOrderIds[0]}`);
      } else {
        router.push(`/orders`);
      }
      
    } catch (error: any) {
      console.error("Order submission error:", error);
      alert(error.message || "Something went wrong while placing your order.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground pb-20 font-sans selection:bg-accent selection:text-black">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white/5 hover:bg-white/10 text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="font-extrabold text-xl tracking-tight">Checkout</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Delivery & Payment Details */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Delivery Section */}
            <Card className="bg-card/60 backdrop-blur-xl border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-lg font-extrabold flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-accent" /> Delivery Details
              </h2>
              
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Campus Drop-off Location</p>
                    <p className="font-bold text-base text-white">{deliveryLocation}</p>
                    {maxDistanceKm > 0 && (
                      <p className="text-xs text-accent mt-1 flex items-center gap-1 font-medium">
                        <Navigation className="w-3 h-3" /> ~{maxDistanceKm} km from vendor
                      </p>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddressModalOpen(true)} className="bg-transparent border-white/20 hover:bg-white/10 text-xs rounded-xl h-8">
                    Change
                  </Button>
                </div>

                {/* Delivery Mode Selector */}
                {deliveryModes.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Delivery Method {selectedMode && <span className="text-accent font-normal lowercase">(auto-matched by distance)</span>}
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {deliveryModes.map((mode) => {
                        const isEligible = mode.maxDistanceKm >= maxDistanceKm || mode.id === deliveryModes[deliveryModes.length - 1]?.id;
                        const isSelected = selectedMode?.id === mode.id;
                        return (
                          <div
                            key={mode.id}
                            onClick={() => isEligible && setSelectedMode(mode)}
                            className={`p-3 rounded-2xl border transition-all ${
                              !isEligible 
                                ? "opacity-40 cursor-not-allowed bg-white/[0.02] border-white/5" 
                                : isSelected
                                ? "bg-accent/10 border-accent text-white cursor-pointer shadow-sm"
                                : "bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-sm">{mode.name}</span>
                              <span className="font-black text-sm text-accent">₦{mode.baseFee}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {isEligible ? `Up to ${mode.maxDistanceKm}km radius` : `Too far (> ${mode.maxDistanceKm}km)`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Room Number / Exact Spot *</label>
                  <Input 
                    required 
                    placeholder="e.g., Block B, Room 204 or 'Wait by the buttery'" 
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder:text-muted-foreground/50 focus-visible:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Delivery Note for Rider (Optional)</label>
                  <Input 
                    placeholder="e.g., Call me when you get to the porter's lodge" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder:text-muted-foreground/50 focus-visible:ring-accent"
                  />
                </div>
              </div>
            </Card>

            {/* Payment Section */}
            <Card className="bg-card/60 backdrop-blur-xl border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-lg font-extrabold flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-accent" /> Payment Method
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div 
                  onClick={() => setPaymentMethod("transfer")}
                  className={`border rounded-2xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 ${paymentMethod === "transfer" ? "bg-accent/10 border-accent text-accent shadow-sm" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="font-bold text-sm">Bank Transfer</span>
                </div>
                
                <div 
                  onClick={() => setPaymentMethod("card")}
                  className={`border rounded-2xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 ${paymentMethod === "card" ? "bg-accent/10 border-accent text-accent shadow-sm" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="font-bold text-sm">Pay with Card</span>
                </div>

                <div 
                  onClick={() => setPaymentMethod("cash")}
                  className={`border rounded-2xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 ${paymentMethod === "cash" ? "bg-accent/10 border-accent text-accent shadow-sm" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}
                >
                  <Wallet className="w-6 h-6" />
                  <span className="font-bold text-sm">Pay on Delivery</span>
                </div>
              </div>
              
              {paymentMethod === "transfer" && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-200 flex items-start gap-2.5 leading-relaxed">
                  <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span>Powered by Monnify. You will receive a dedicated dynamic virtual account number to transfer to, with instant confirmation.</span>
                </div>
              )}

              {paymentMethod === "card" && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5 leading-relaxed">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Powered by Monnify. Accepts Mastercard, Visa, and Verve debit cards with bank-grade 3D Secure verification.</span>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <Card className="bg-card/60 backdrop-blur-xl border-white/10 rounded-3xl p-6 shadow-xl sticky top-24">
              <h2 className="text-lg font-extrabold mb-4">Order Summary</h2>
              
              {/* Prep Time & Batching Smart Banner */}
              <div className="mb-4 space-y-2">
                {(() => {
                  const vendorList = Object.values(vendorDetails) as any[];
                  const primaryQueue = vendorList[0]?.queueStatus || {
                    status: 'Available',
                    demand: 'Low',
                    color: 'green',
                    time: '20 – 30 mins'
                  };
                  const isHighDemand =
                    primaryQueue.status === 'Rush Hour' ||
                    primaryQueue.demand === 'High' ||
                    primaryQueue.demand === 'Very High';
                  const badgeColor =
                    primaryQueue.color === 'red'
                      ? 'text-red-400 bg-red-500/15 border-red-500/30'
                      : primaryQueue.color === 'yellow'
                      ? 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30'
                      : 'text-green-400 bg-green-500/15 border-green-500/30';

                  return (
                    <>
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                            <Clock className="w-4 h-4 text-accent shrink-0" />
                            <span className="whitespace-nowrap">Est. Arrival Time</span>
                          </div>
                          <span className="text-sm font-extrabold text-white whitespace-nowrap">
                            {primaryQueue.time || '20 – 30 mins'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                          <span className="text-muted-foreground font-medium">Kitchen Queue</span>
                          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${badgeColor}`}>
                            {primaryQueue.status} • {primaryQueue.demand} Demand
                          </span>
                        </div>
                      </div>

                      {isHighDemand && (
                        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-[11px] flex items-start gap-2 leading-relaxed">
                          <Clock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-white">Peak Kitchen Queue ({primaryQueue.status}):</strong> Extended preparation times are active right now so your runner is dispatched right as your meal finishes cooking.
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}

                <div className="p-3 rounded-2xl bg-gradient-to-r from-accent/10 via-amber-500/5 to-transparent border border-accent/20 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    <strong className="text-white">Hostel Batching Active:</strong> If another student in <span className="text-accent font-semibold">{deliveryLocation.split('(')[0].trim()}</span> orders from the same spot within 5 mins, your delivery fee splits automatically!
                  </p>
                </div>
              </div>

              {vendorCount > 1 && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2 leading-relaxed">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>Your cart has items from <strong>{vendorCount} different vendors</strong>. Separate runners will be dispatched for each vendor ({vendorCount}x delivery fee).</span>
                </div>
              )}

              <div className="space-y-5 max-h-[40vh] overflow-y-auto pr-2 mb-6">
                {Object.entries(vendorGroups).map(([vId, group]) => (
                  <div key={vId} className="space-y-3">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded-md inline-block">
                      {group.vendorName}
                    </div>
                    {group.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm pl-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-muted-foreground">{item.quantity}x</span>
                          <div>
                            <p className="font-bold text-white line-clamp-1">{item.name}</p>
                          </div>
                        </div>
                        <span className="font-bold">₦{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <Separator className="bg-white/10 my-4" />

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">₦{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    Delivery Fee {selectedMode ? `(${selectedMode.name})` : ''} {vendorCount > 1 ? `x${vendorCount}` : ''}
                  </span>
                  <span className="text-white font-medium">₦{totalDeliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">Service Fee <Info className="w-3 h-3 opacity-50" /></span>
                  <span className="text-white font-medium">₦{serviceFee.toLocaleString()}</span>
                </div>
                
                <Separator className="bg-white/10 my-2" />
                
                <div className="flex justify-between text-base font-black pt-2">
                  <span>Total to Pay</span>
                  <span className="text-accent text-xl">₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full mt-6 bg-accent hover:bg-accent/90 text-black font-black h-14 rounded-xl shadow-md transition-all text-base"
              >
                {isSubmitting ? "Processing Order..." : `Confirm & Pay ₦${grandTotal.toLocaleString()}`}
              </Button>
            </Card>
          </div>

        </form>
      </div>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />

      <DeliveryAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        activeAddress={deliveryLocation}
        onSelectAddress={setDeliveryLocation}
      />
    </main>
  );
}
