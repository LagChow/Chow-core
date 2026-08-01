"use client";

import React, { useState } from 'react';
import { MapPin, Navigation, Store, CheckCircle2, Phone, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import axios from 'axios';

export function ActiveDelivery({ order, onUpdate }: { order: any, onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleUpdateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      await axios.patch(`/api/deliveries/${order.id}/status`, { status: newStatus });
      onUpdate();
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  let nextAction = null;
  let StatusIcon = Navigation;
  let statusColor = 'text-blue-500';

  switch (order.status) {
    case 'rider_accepted':
      nextAction = { label: "I'm at the Vendor", nextStatus: 'rider_at_vendor' };
      StatusIcon = Store;
      break;
    case 'rider_at_vendor':
      nextAction = { label: "I've Picked Up Order", nextStatus: 'out_for_delivery' };
      StatusIcon = Store;
      statusColor = 'text-yellow-500';
      break;
    case 'out_for_delivery':
      nextAction = { label: "I'm at the Customer", nextStatus: 'arrived' };
      StatusIcon = Navigation;
      statusColor = 'text-accent';
      break;
    case 'arrived':
      nextAction = { label: "Mark as Delivered", nextStatus: 'delivered' };
      StatusIcon = CheckCircle2;
      statusColor = 'text-green-500';
      break;
    case 'delivered':
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-bold">Delivery Completed!</h3>
          <p className="text-sm text-muted-foreground mt-2">Great job. You earned ₦{order.deliveryFee}</p>
          <Button onClick={onUpdate} variant="outline" className="mt-6 border-white/10">Back to Pool</Button>
        </div>
      );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-md border border-accent/20 p-5 rounded-3xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-black/40 border border-white/10`}>
          <StatusIcon className={`w-5 h-5 ${statusColor}`} />
        </div>
        <div>
          <h3 className="font-black text-lg text-white">Active Delivery</h3>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
            {order.status.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      <div className="space-y-5 relative z-10">
        
        {/* Vendor Info */}
        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
          <div className="flex items-start gap-3">
            <Store className="w-5 h-5 text-accent mt-0.5" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Pickup From</p>
              <h4 className="font-bold text-base">{order.vendor?.name}</h4>
              <p className="text-sm text-muted-foreground">{order.vendor?.address}</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Deliver To</p>
              <h4 className="font-bold text-base">{order.deliveryAddress?.hall}</h4>
              <p className="text-sm text-muted-foreground">{order.deliveryAddress?.room}</p>
              {order.notes && (
                <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/5 text-xs text-white">
                  <span className="font-bold text-accent">Note:</span> {order.notes}
                </div>
              )}
            </div>
            
            <Button size="icon" variant="outline" className="rounded-full bg-black/50 border-white/10 shrink-0 h-10 w-10">
              <Phone className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>
        
        {/* Action Button */}
        {nextAction && (
          <Button 
            onClick={() => handleUpdateStatus(nextAction.nextStatus)}
            disabled={loading}
            className="w-full h-14 bg-accent hover:bg-accent/90 text-black font-black text-lg rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.2)] mt-4"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>{nextAction.label} <ArrowRight className="w-5 h-5 ml-2 inline" /></>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
