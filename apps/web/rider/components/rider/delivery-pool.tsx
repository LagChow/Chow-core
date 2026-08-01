"use client";

import React, { useState } from 'react';
import { Clock, MapPin, Store, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import axios from 'axios';

export function DeliveryPool({ deliveries, onClaimSuccess }: { deliveries: any[], onClaimSuccess: () => void }) {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleClaim = async (id: string) => {
    setClaimingId(id);
    setError('');
    try {
      await axios.post(`/api/deliveries/${id}/claim`);
      onClaimSuccess();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to claim order. Another rider may have taken it.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setClaimingId(null);
    }
  };

  if (deliveries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-white/20" />
        </div>
        <h3 className="text-lg font-bold">No Available Orders</h3>
        <p className="text-sm text-muted-foreground mt-2">Waiting for new orders to arrive in your area...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 text-red-500 text-sm font-semibold p-3 rounded-xl border border-red-500/20 mb-2">
          {error}
        </div>
      )}
      
      {deliveries.map(order => (
        <Card key={order.id} className="bg-card/50 backdrop-blur-md border-white/5 p-4 rounded-2xl flex flex-col gap-3 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Store className="w-4 h-4 text-accent" />
                <h4 className="font-bold text-base">{order.vendor?.name || 'Unknown Vendor'}</h4>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{order.vendor?.address || 'Vendor Address'}</p>
            </div>
            <div className="text-right">
              <span className="font-black text-lg text-white">₦{order.deliveryFee.toLocaleString()}</span>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Earnings</p>
            </div>
          </div>
          
          <div className="h-px w-full bg-white/5 my-1" />
          
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{order.deliveryAddress?.hall || 'Dropoff Location'}</p>
              <p className="text-xs text-muted-foreground">{order.deliveryAddress?.room || ''}</p>
            </div>
          </div>

          <Button 
            onClick={() => handleClaim(order.id)}
            disabled={claimingId !== null}
            className="w-full bg-accent hover:bg-accent/90 text-black font-black mt-2 h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
          >
            {claimingId === order.id ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Claim Delivery <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </Card>
      ))}
    </div>
  );
}
