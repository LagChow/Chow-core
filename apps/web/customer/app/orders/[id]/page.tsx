"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MapPin, CheckCircle2, Clock, Map, PhoneCall, Receipt, Info, ChefHat, Bike, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import axios from 'axios';
import Image from 'next/image';

const STATUS_STEPS = [
  { id: 'pending', label: 'Order Received', desc: 'We have received your order and are waiting for the vendor to accept it.' },
  { id: 'accepted', label: 'Order Accepted', desc: 'The vendor has accepted your order.' },
  { id: 'preparing', label: 'Preparing your order', desc: 'The vendor is currently preparing your food.' },
  { id: 'ready', label: 'Order Ready', desc: 'Your order is packed and ready.' },
  { id: 'rider_accepted', label: 'Rider accepted order', desc: 'A rider has been assigned and is heading to the vendor.' },
  { id: 'rider_at_vendor', label: 'Rider at the vendor', desc: 'The rider is waiting at the vendor to pick up your order.' },
  { id: 'out_for_delivery', label: 'Rider picked up order', desc: 'Your order is on the way to you.' },
  { id: 'arrived', label: 'Order arrived', desc: 'The rider has arrived at your location.' },
  { id: 'delivered', label: 'Order delivered', desc: 'Enjoy your meal!' },
];

const queueColorMap: Record<string, any> = {
  red: { text: 'text-red-500', bg: 'bg-red-500' },
  yellow: { text: 'text-yellow-500', bg: 'bg-yellow-500' },
  green: { text: 'text-green-500', bg: 'bg-green-500' }
};

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params); // Next 15 hook unpacking
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await axios.get(`/api/orders/${id}`);
        setOrder(res.data);
      } catch (e) {
        console.error("Failed to fetch order", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
    
    // Polling every 10 seconds for real-time status updates
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-background p-4 flex flex-col items-center justify-center text-center">
        <h2 className="font-bold text-xl mb-2">Order Not Found</h2>
        <p className="text-muted-foreground text-sm mb-6">This order might not exist or you don&apos;t have access to it.</p>
        <Button onClick={() => router.push('/orders')} className="bg-accent text-black">Go Back</Button>
      </main>
    );
  }

  const currentStatusIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  // If cancelled, handle separately
  const isCancelled = order.status === 'cancelled';

  const getStatusIcon = () => {
    switch(order.status) {
      case 'pending': return <Clock className="w-5 h-5 text-accent animate-pulse" />;
      case 'accepted': return <CheckCircle2 className="w-5 h-5 text-accent" />;
      case 'preparing': return <ChefHat className="w-5 h-5 text-accent" />;
      case 'out_for_delivery': return <Bike className="w-5 h-5 text-accent animate-pulse" />;
      case 'delivered': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default: return <Clock className="w-5 h-5 text-accent" />;
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground pb-32 font-sans selection:bg-accent selection:text-black">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/orders')} className="rounded-full hover:bg-white/10">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-black text-lg tracking-tight leading-none">Order Tracking</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">ID: {order.id.slice(0, 8)}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-accent">
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Tracker Card */}
        <Card className="bg-card border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          {/* Subtle gradient background effect based on status */}
          <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 rounded-full pointer-events-none 
            ${order.status === 'delivered' ? 'bg-green-500' : isCancelled ? 'bg-red-500' : 'bg-accent'}`} 
          />

          <div className="flex items-start justify-between mb-8 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-sm text-accent">{order.vendor?.name || 'Vendor'}</h3>
                <span className="text-xs text-white/50">•</span>
                <span className="text-xs text-white/50">Order #LC-{order.id.slice(0, 4).toUpperCase()}</span>
              </div>
              <h2 className="font-black text-2xl mb-1">{isCancelled ? 'Order Cancelled' : STATUS_STEPS[Math.max(0, currentStatusIndex)]?.label}</h2>
              {isCancelled && (
                <p className="text-xs font-semibold text-muted-foreground mb-4">
                  This order was cancelled.
                </p>
              )}
              
              {!isCancelled && order.status !== 'delivered' && (() => {
                const qColor = queueColorMap[order.vendor?.queueStatus?.color] || queueColorMap.yellow;
                return (
                  <div className="inline-flex flex-col bg-white/5 border border-white/10 rounded-xl p-4 mt-2">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Demand</span>
                        <div className={`flex items-center gap-2 font-black text-lg ${qColor.text}`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${qColor.bg} animate-pulse shadow-[0_0_10px_currentColor]`}></span>
                          {order.vendor?.queueStatus?.demand || 'Moderate'}
                        </div>
                      </div>
                      <div className="w-[1px] h-8 bg-white/10"></div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Est. Prep Time</span>
                        <span className="font-bold text-sm text-white">{order.vendor?.queueStatus?.time || '22–28 min'}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            {!isCancelled && order.status !== 'delivered' && (
              <div className="w-12 h-12 rounded-full border border-accent/30 flex items-center justify-center bg-accent/10 relative shrink-0">
                <div className="absolute inset-0 rounded-full animate-ping bg-accent/20" />
                {getStatusIcon()}
              </div>
            )}
          </div>

          {!isCancelled && (
            <div className="space-y-6 relative z-10">
              {STATUS_STEPS.map((step, index) => {
                const isActive = index === currentStatusIndex;
                const isCompleted = index <= currentStatusIndex;
                
                // Format the time from statusTimestamps
                let timeString = '';
                if (isCompleted && order.statusTimestamps && order.statusTimestamps[step.id]) {
                  timeString = new Date(order.statusTimestamps[step.id]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
                } else if (index === 0 && order.createdAt) {
                  timeString = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
                }

                return (
                  <div key={step.id} className="flex gap-4 relative">
                    {/* Vertical line connector */}
                    {index !== STATUS_STEPS.length - 1 && (
                      <div className={`absolute left-3 top-8 w-1 h-full -ml-[2px] ${isCompleted && !isActive ? 'bg-accent/80' : 'bg-white/5'}`} />
                    )}
                    
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors mt-0.5
                      ${isActive ? 'bg-accent shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 
                        isCompleted ? 'bg-accent/80' : 'bg-white/10'}`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${isActive || isCompleted ? 'bg-black' : 'bg-transparent'}`} />
                    </div>
                    
                    <div className={`pt-0.5 flex-1 flex items-center gap-2 ${isActive ? 'opacity-100' : isCompleted ? 'opacity-80' : 'opacity-40'}`}>
                      <h4 className={`text-base ${isActive || isCompleted ? 'font-bold' : 'font-medium'}`}>{step.label}</h4>
                      {timeString && <span className="text-muted-foreground text-sm font-medium">• {timeString}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Vendor & Delivery Info */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card/50 border-white/5 rounded-3xl p-4 flex flex-col items-center text-center justify-center gap-2 hover:bg-white/[0.02] transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Delivery To</p>
              <p className="font-bold text-sm leading-tight mt-0.5">{order.deliveryAddress?.hall}</p>
              {order.deliveryAddress?.room && <p className="text-xs text-muted-foreground mt-0.5">Rm {order.deliveryAddress.room}</p>}
            </div>
          </Card>
          
          <Card className="bg-card/50 border-white/5 rounded-3xl p-4 flex flex-col items-center text-center justify-center gap-2 hover:bg-white/[0.02] transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Contact Vendor</p>
              <p className="font-bold text-sm leading-tight mt-0.5 line-clamp-1">{order.vendor?.name}</p>
              <Button variant="link" className="h-auto p-0 text-accent text-xs mt-0.5">Call now</Button>
            </div>
          </Card>
        </div>

        {/* Order Details */}
        <Card className="bg-card/50 border-white/5 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Order Summary</h3>
          </div>
          
          <div className="space-y-4">
            {order.items?.map((itemRow: any) => (
              <div key={itemRow.id} className="flex gap-4">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                  <Image src={itemRow.item?.image || ''} alt={itemRow.item?.name || 'Item'} fill className="object-cover" />
                  <div className="absolute top-0 right-0 bg-black/80 px-1.5 py-0.5 rounded-bl-lg font-black text-[10px]">
                    x{itemRow.quantity}
                  </div>
                </div>
                <div className="flex-1 pt-0.5">
                  <h4 className="font-bold text-sm line-clamp-2 leading-tight">{itemRow.item?.name}</h4>
                  <span className="font-semibold text-xs text-muted-foreground">₦{itemRow.priceAtTime.toLocaleString()} each</span>
                </div>
                <div className="font-black text-sm pt-0.5">
                  ₦{(itemRow.priceAtTime * itemRow.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-4 space-y-2 text-sm mt-4">
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>Subtotal</span>
              <span className="text-white">₦{order.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>Delivery Fee</span>
              <span className="text-white">₦{order.deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>Convenience Fee</span>
              <span className="text-white">{order.convenienceFee === 0 ? "Free" : `₦${order.convenienceFee.toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between font-black text-lg text-foreground pt-3 border-t border-white/5 mt-2">
              <span>Total Paid</span>
              <span className="text-accent">₦{(order.totalAmount + order.deliveryFee + order.convenienceFee).toLocaleString()}</span>
            </div>
          </div>
        </Card>
        
      </div>
    </main>
  );
}
