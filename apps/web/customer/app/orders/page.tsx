"use client";

import React, { useEffect, useState } from 'react';
import { ChevronLeft, Package, Clock, Store, MapPin, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import axios from 'axios';
import Link from 'next/link';

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending': return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-yellow-500/20 text-yellow-500">Pending</span>;
    case 'accepted': return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-500">Accepted</span>;
    case 'preparing': return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-500">Preparing</span>;
    case 'out_for_delivery': return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-orange-500/20 text-orange-500">Out for Delivery</span>;
    case 'delivered': return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-green-500/20 text-green-500">Delivered</span>;
    case 'cancelled': return <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-red-500/20 text-red-500">Cancelled</span>;
    default: return null;
  }
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await axios.get('/api/orders');
        setOrders(res.data);
      } catch (e) {
        console.error("Failed to fetch orders", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground pb-32 font-sans selection:bg-accent selection:text-black">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full hover:bg-white/10">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-black text-xl tracking-tight">Order History</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 mt-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-card border-white/5 rounded-3xl p-5 h-32 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-bold text-lg mb-2">No orders yet</h2>
            <p className="text-muted-foreground text-sm max-w-[250px] mb-6">Looks like you haven't placed any orders. Hungry?</p>
            <Button onClick={() => router.push('/')} className="bg-accent text-black font-bold rounded-xl h-12 px-8">
              Start Browsing
            </Button>
          </div>
        ) : (
          orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="bg-card/50 hover:bg-white/[0.02] border-white/5 hover:border-white/10 transition-colors rounded-3xl p-5 cursor-pointer flex flex-col sm:flex-row gap-4 justify-between group mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold text-sm">{order.vendor?.name || 'Unknown Vendor'}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {order.deliveryAddress?.hall}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-white/5 sm:border-0 pt-3 sm:pt-0">
                  <span className="font-black text-lg text-accent">₦{(order.totalAmount + order.deliveryFee + order.convenienceFee).toLocaleString()}</span>
                  <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                    {order.paymentStatus === 'paid' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : null}
                    {order.paymentMethod.toUpperCase()}
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
