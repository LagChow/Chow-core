"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useUser } from '@/hooks/use-user';
import { AuthModal } from '@/components/auth-modal';
import { ChevronLeft, ChevronRight, MapPin, Bike, CalendarDays, Wallet, Globe, User, MessageSquare, Gift, CheckCircle2, Clock, MoveDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import axios from 'axios';

import { UNILAG_LOCATIONS } from '@/lib/constants';

function getConvenienceFee(amount: number) {
  if (amount < 2000) return 0;
  if (amount < 4000) return 200;
  if (amount < 6000) return 300;
  if (amount < 8000) return 400;
  if (amount < 10000) return 500;
  if (amount < 15000) return 600;
  return 700;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, totalItems, deliveryLocation } = useCart();
  const { user, loading: userLoading } = useUser();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [deliveryModes, setDeliveryModes] = useState<any[]>([]);
  const [selectedMode, setSelectedMode] = useState<any>(null);
  const [vendorLocation, setVendorLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoadingModes, setIsLoadingModes] = useState(true);
  
  // Accordion open states
  const [showAddress, setShowAddress] = useState(false);
  const [showNote, setShowNote] = useState(false);
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "online" | "transfer">("transfer");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    hall: "",
    room: "",
    note: "",
    customAddress: ""
  });

  // Prefill user data
  useEffect(() => {
    if (!form.hall) {
      let defaultHall = "";
      let customAddr = "";
      
      const locToUse = deliveryLocation || (user ? (user.hallOfResidence || user.landmark || "") : "");
      
      if (locToUse) {
         // Check if locToUse matches any UNILAG_LOCATIONS exactly
         const found = UNILAG_LOCATIONS.find(loc => loc.toLowerCase() === locToUse.split(',')[0].toLowerCase() || loc.toLowerCase() === locToUse.toLowerCase());
         if (found) {
           defaultHall = found;
         } else {
           defaultHall = "Other";
           customAddr = locToUse.split(',')[0]; // Store the primary name
         }
      }
      
      setForm(prev => ({
        ...prev,
        hall: defaultHall,
        customAddress: customAddr,
        room: user ? ((user as any).roomNumber || "") : ""
      }));
    }
  }, [user, deliveryLocation]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [maxPrepTime, setMaxPrepTime] = useState(15);

  // Calculations
  const uniqueVendors = useMemo(() => new Set(items.map(i => i.vendorId)).size, [items]);
  const deliveryFee = selectedMode ? selectedMode.baseFee * uniqueVendors : 0;
  const convenienceFee = getConvenienceFee(totalAmount);
  const grandTotal = totalAmount + deliveryFee + convenienceFee;

  // Haversine distance formula
  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // Fetch Vendor & Delivery Modes
  useEffect(() => {
    if (items.length === 0) return;
    const vendorId = items[0].vendorId;

    async function loadData() {
      setIsLoadingModes(true);
      try {
        const [vendorRes, modesRes, menuRes] = await Promise.all([
          axios.get(`/api/vendors/${vendorId}`),
          axios.get(`/api/delivery-modes`),
          axios.get(`/api/menu?vendorId=${vendorId}`)
        ]);

        const vendorData = vendorRes.data.vendor || vendorRes.data;
        const modesData = modesRes.data;
        const menuItems = menuRes.data.items || [];

        // Calculate max prep time
        let maxPrep = 15;
        const isHighDemand = vendorData.queueStatus?.demand === 'High' || vendorData.queueStatus?.demand === 'Very High' || vendorData.queueStatus?.status === 'Rush Hour';
        
        items.forEach(cartItem => {
          const dbItem = menuItems.find((i: any) => i.id === cartItem.id);
          if (dbItem) {
            const prep = isHighDemand && dbItem.peakPreparationTime ? dbItem.peakPreparationTime : dbItem.preparationTime;
            if (prep && Number(prep) > maxPrep) maxPrep = Number(prep);
          }
        });
        setMaxPrepTime(maxPrep);

          // Mock customer location (Akoka, UNILAG)
          const customerLat = 6.5268;
          const customerLng = 3.3868;

          const vLat = vendorData.lat || 6.5314; // Default to Daleko
          const vLng = vendorData.lng || 3.3383;

          setVendorLocation({ lat: vLat, lng: vLng });

          const distance = getDistance(vLat, vLng, customerLat, customerLng);

          // Filter suitable modes
          const suitableModes = modesData.filter((m: any) => distance <= m.maxDistanceKm && m.isActive);
          setDeliveryModes(suitableModes);
          
          if (suitableModes.length > 0) {
            setSelectedMode(suitableModes[0]);
          }
      } catch (e) {
        console.error(e);
      }
      setIsLoadingModes(false);
    }
    
    loadData();
  }, [items]);

  // If cart is empty, redirect home
  useEffect(() => {
    if (items.length === 0) {
      router.push("/stores");
    }
  }, [items, router]);

  if (items.length === 0) return null;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    
    if (!form.hall) {
      alert("Please select your delivery location.");
      setShowAddress(true);
      return;
    }
    
    if (form.hall === "Other" && !form.customAddress) {
      alert("Please describe your location.");
      setShowAddress(true);
      return;
    }
    
    setIsPlacingOrder(true);
    try {
      // Group items by vendor
      const itemsByVendor = items.reduce((acc: any, item) => {
        if (!acc[item.vendorId]) acc[item.vendorId] = [];
        acc[item.vendorId].push(item);
        return acc;
      }, {});

      const vendorIds = Object.keys(itemsByVendor);
      
      // Place an order for each vendor separately
      for (const vId of vendorIds) {
        const vItems = itemsByVendor[vId];
        const vTotalAmount = vItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
        
        await axios.post("/api/orders", {
          vendorId: vId,
          items: vItems,
          deliveryModeId: selectedMode?.id,
          totalAmount: vTotalAmount,
          deliveryFee: selectedMode ? selectedMode.baseFee : 0, // Fee per vendor
          convenienceFee: getConvenienceFee(vTotalAmount), // Pro-rated or calculated per vendor
          deliveryAddress: { hall: form.hall === "Other" ? form.customAddress : form.hall, room: form.room },
          notes: form.note,
          paymentMethod
        });
      }
      
      // Since it could be multiple orders, redirect to the general orders page
      router.push("/orders");
    } catch (error) {
      console.error(error);
      alert("Failed to place order.");
      setIsPlacingOrder(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground pb-32 font-sans selection:bg-accent selection:text-black">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-white/10">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-black text-xl tracking-tight">Checkout</h1>
          </div>
          <span className="text-sm font-semibold text-muted-foreground">{totalItems} items</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 mt-2">
        <form onSubmit={handlePlaceOrder} className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* LEFT COLUMN: The Chowdeck-style Flow */}
          <div className="flex-1 space-y-8">
            
            <Card className="bg-card border border-white/5 rounded-3xl overflow-hidden shadow-lg">
              
              <div className="p-5 sm:p-7 space-y-6">
                
                {/* Delivery Speed Options */}
                <div>
                  <h3 className="font-semibold mb-2">Suitable Delivery Modes</h3>
                  {isLoadingModes ? (
                    <div className="text-sm text-muted-foreground animate-pulse">Calculating optimal routes...</div>
                  ) : deliveryModes.length === 0 ? (
                    <div className="text-sm text-red-400">No suitable delivery options for your distance.</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {deliveryModes.map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setSelectedMode(mode)}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedMode?.id === mode.id ? "border-accent bg-accent/10" : "border-white/10 hover:bg-white/5"}`}
                        >
                          <MapPin className={`w-5 h-5 mb-2 ${selectedMode?.id === mode.id ? "text-accent" : "text-muted-foreground"}`} />
                          <span className="font-bold text-sm">{mode.name}</span>
                          <span className="text-[10px] text-muted-foreground">₦{mode.baseFee.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-accent text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> PIN required for delivery
                </div>

                <div className="h-px bg-white/10 w-full my-2"></div>

                {/* Clickable Action Rows */}
                <div className="space-y-1">
                  
                  <div className="border border-transparent hover:bg-white/[0.02] rounded-2xl transition-colors">
                    <div 
                      onClick={() => setShowAddress(!showAddress)}
                        className="flex items-center justify-between py-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-white transition-colors">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                          <p className="font-bold text-sm">
                            {form.hall ? (form.hall === "Other" ? (form.customAddress || "Add Delivery Address") : `${form.hall}${form.room ? ` - ${form.room}` : ""}`) : "Add Delivery Address"}
                          </p>
                          <p className="text-xs text-muted-foreground">Campus details</p>
                        </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showAddress ? "rotate-90" : ""}`} />
                      </div>
                      
                      {/* Address Accordion Content */}
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showAddress ? "max-h-[300px] opacity-100 pb-4 px-2" : "max-h-0 opacity-0"}`}>
                        <div className="space-y-3 pt-2">
                          <select 
                            value={form.hall}
                            onChange={(e) => setForm({...form, hall: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 h-12 rounded-xl px-3 outline-none focus:border-accent transition-all text-sm"
                          >
                            <option value="">Select your location</option>
                            {UNILAG_LOCATIONS.map(loc => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))}
                          </select>
                          
                          {form.hall === "Other" ? (
                            <Input 
                              placeholder="Please describe your location (e.g. Under the tree at...)"
                              value={form.customAddress}
                              onChange={(e) => setForm({...form, customAddress: e.target.value})}
                              className="bg-black/40 border-white/10 h-12 rounded-xl focus-visible:ring-accent text-sm" 
                            />
                          ) : selectedMode && (
                            <Input 
                              placeholder="Room Number, Wing, or Department (Optional)" 
                              value={form.room}
                              onChange={(e) => setForm({...form, room: e.target.value})}
                              className="bg-black/40 border-white/10 h-12 rounded-xl focus-visible:ring-accent text-sm" 
                            />
                          )}
                        </div>
                      </div>
                    </div>

                  <div className="border border-transparent hover:bg-white/[0.02] rounded-2xl transition-colors">
                    <div 
                      onClick={() => setShowNote(!showNote)}
                      className="flex items-center justify-between py-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-white transition-colors">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">Leave a note for your rider</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{form.note || "Any instructions for a smooth order etc."}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showNote ? "rotate-90" : ""}`} />
                    </div>
                    
                    {/* Note Accordion Content */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showNote ? "max-h-[150px] opacity-100 pb-4 px-2" : "max-h-0 opacity-0"}`}>
                      <div className="pt-2">
                        <Input 
                          placeholder="e.g. Call me when you get to the gate" 
                          value={form.note}
                          onChange={(e) => setForm({...form, note: e.target.value})}
                          className="bg-black/40 border-white/10 h-12 rounded-xl focus-visible:ring-accent text-sm" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border border-transparent hover:bg-white/[0.02] rounded-2xl transition-colors">
                    <div className="flex items-center justify-between py-3 cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-accent">
                          <Gift className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">Gift this order</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>

                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-accent tracking-wide uppercase">Payment Method</h2>
                <span className="text-sm text-accent cursor-pointer hover:underline">+ Add new</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  onClick={() => setPaymentMethod("wallet")}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === "wallet" ? "border-accent bg-accent/5" : "border-white/10 bg-card hover:bg-white/5"}`}
                >
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                  <span className="font-bold text-sm">Wallet (₦0.00)</span>
                </div>
                
                <div 
                  onClick={() => setPaymentMethod("online")}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === "online" ? "border-accent bg-accent/5" : "border-white/10 bg-card hover:bg-white/5"}`}
                >
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <span className="font-bold text-sm">Pay online</span>
                </div>

                <div 
                  onClick={() => setPaymentMethod("transfer")}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === "transfer" ? "border-accent bg-accent/5" : "border-white/10 bg-card hover:bg-white/5"}`}
                >
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span className="font-bold text-sm">Pay with Transfer</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="w-full lg:w-[400px]">
            <Card className="bg-card/50 backdrop-blur-xl border-white/10 rounded-3xl p-6 lg:p-8 sticky top-24 shadow-2xl">
              
              <div className="mb-8 border border-white/10 rounded-2xl p-5 bg-black/20">
                <h3 className="font-bold mb-4 text-white uppercase tracking-wider text-xs">Estimated Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-white/80">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="flex-1 text-sm font-semibold">Preparation</span>
                    <span className="text-sm font-black">{maxPrepTime} mins</span>
                  </div>
                  
                  <div className="pl-1.5 py-1">
                    <MoveDown className="w-4 h-4 text-white/20" />
                  </div>
                  
                  <div className="flex items-center gap-3 text-white/80">
                    <Bike className="w-4 h-4 text-accent" />
                    <span className="flex-1 text-sm font-semibold">Pickup & Transit</span>
                    <span className="text-sm font-black">{selectedMode?.estimatedMins || 20} mins</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Total ETA</span>
                    <span className="font-black text-lg text-accent">{maxPrepTime + (selectedMode?.estimatedMins || 20)} mins</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                      <div className="absolute top-0 right-0 bg-black/80 px-1.5 py-0.5 rounded-bl-lg font-black text-[10px]">
                        x{item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="font-bold text-sm line-clamp-2 leading-tight mb-1">{item.name}</h4>
                      <span className="font-black text-sm text-accent">₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-5 space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Subtotal</span>
                  <span className="text-white">₦{totalAmount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>{selectedMode ? selectedMode.name : "Delivery"}</span>
                  <span className="text-white">₦{deliveryFee.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Campus Convenience Fee</span>
                  <span className="text-white">
                    {convenienceFee === 0 ? "Free" : `₦${convenienceFee.toLocaleString()}`}
                  </span>
                </div>
                
                <div className="flex justify-between font-black text-xl text-foreground pt-4 border-t border-white/5 mt-2">
                  <span>Total</span>
                  <span className="text-accent">₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <Button type="submit" disabled={isPlacingOrder} className="w-full bg-accent hover:bg-accent/90 text-black font-black h-14 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all text-lg disabled:opacity-50 disabled:pointer-events-none">
                {isPlacingOrder ? "Placing Order..." : "Place Order"}
              </Button>
            </Card>
          </div>

        </form>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </main>
  );
}
