"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Package, CheckCircle2, Bike, MapPin, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

const TABS: { id: OrderStatus, label: string }[] = [
  { id: 'pending', label: 'New Orders' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'out_for_delivery', label: 'Ready for Pickup' },
  { id: 'delivered', label: 'Completed' }
];

export default function OrdersView({ vendorId }: { vendorId: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [prepTime, setPrepTime] = useState(15);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // In a real app we'd fetch vendor prepTime here too or it comes with orders endpoint
      const [ordersRes, vendorRes] = await Promise.all([
        axios.get(`/api/orders?vendorId=${vendorId}`),
        axios.get(`/api/vendors/${vendorId}`).catch(() => ({ data: { preparationTime: 15 } }))
      ]);
      setOrders(ordersRes.data);
      if (vendorRes.data.preparationTime) {
        setPrepTime(vendorRes.data.preparationTime);
      }
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const handleOneTapUpdate = async (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = 'pending';
    if (currentStatus === 'pending') nextStatus = 'accepted';
    else if (currentStatus === 'accepted') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'out_for_delivery';
    else if (currentStatus === 'out_for_delivery') nextStatus = 'delivered';

    setActionLoading(orderId);
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      
      const payload: any = { status: nextStatus };
      if (nextStatus === 'preparing') {
        payload.preparationTime = prepTime;
      }
      
      await axios.patch(`/api/orders/${orderId}/status`, payload);
      
      // Auto-switch tabs to follow the order
      setActiveTab(nextStatus);
    } catch (e) {
      console.error(e);
      alert("Failed to update order status");
      fetchData(); // revert on fail
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = orders.filter(o => o.status === activeTab);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Live Orders</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Receiving new orders • Last synced: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto space-x-2 pb-2 hide-scrollbar border-b border-white/5">
        {TABS.map(tab => {
          const count = orders.filter(o => o.status === tab.id).length;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2
                ${isActive 
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/5'
                }
              `}
            >
              {tab.label}
              {count > 0 && (
                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] 
                  ${isActive ? 'bg-black text-white' : 'bg-accent text-black'}
                `}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Order List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Card key={i} className="h-40 bg-card/50 border-white/5 animate-pulse rounded-2xl" />)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-bold text-xl mb-2">No {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} right now</h2>
          <p className="text-muted-foreground text-sm max-w-[250px]">Stay alert! New orders will pop up here automatically.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map(order => (
            <Card key={order.id} className="bg-card/40 border-white/10 rounded-2xl p-5 flex flex-col md:flex-row gap-6">
              
              {/* Order Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-accent tracking-widest uppercase mb-1">
                      Order #{order.id.slice(0, 5)}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-white/80 font-semibold">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  {activeTab === 'pending' && (
                    <Badge className="bg-red-500/20 text-red-500 border border-red-500/30 animate-pulse">
                      NEW
                    </Badge>
                  )}
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <ul className="space-y-2 mb-3">
                    {order.items?.map((item: any) => (
                      <li key={item.id} className="flex justify-between items-start text-sm">
                        <span className="font-bold text-white"><span className="text-accent">{item.quantity}x</span> {item.name}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between items-center border-t border-white/10 pt-3">
                    <span className="text-sm text-muted-foreground font-semibold">Total</span>
                    <span className="font-black text-lg text-white">₦{order.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Delivery & Actions */}
              <div className="md:w-[280px] shrink-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 space-y-4">
                
                <div className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="block font-bold text-white">Delivery Location</span>
                      <span className="text-muted-foreground text-xs">{order.deliveryAddress?.hall} - {order.deliveryAddress?.room || 'N/A'}</span>
                    </div>
                  </div>
                  {order.notes && (
                    <div className="text-xs bg-yellow-500/10 text-yellow-500 p-2 rounded-lg border border-yellow-500/20">
                      <span className="font-bold">Note:</span> {order.notes}
                    </div>
                  )}
                </div>

                {/* ONE TAP ACTIONS */}
                <div className="space-y-2">
                  {order.status === 'pending' && (
                    <Button 
                      onClick={() => handleOneTapUpdate(order.id, order.status)}
                      disabled={actionLoading === order.id}
                      className="w-full bg-accent text-black font-black h-12 shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:scale-[1.02] transition-all"
                    >
                      {actionLoading === order.id ? <Loader2 className="w-5 h-5 animate-spin" /> : "Accept Order"}
                    </Button>
                  )}

                  {order.status === 'accepted' && (
                    <Button 
                      onClick={() => handleOneTapUpdate(order.id, order.status)}
                      disabled={actionLoading === order.id}
                      className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black h-12 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-all"
                    >
                      {actionLoading === order.id ? <Loader2 className="w-5 h-5 animate-spin" /> : `Preparing (${prepTime} mins)`}
                    </Button>
                  )}

                  {order.status === 'preparing' && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-2 bg-white/5 rounded-lg border border-white/10 text-xs text-muted-foreground">
                        <Info className="w-4 h-4 shrink-0 text-accent mt-0.5" />
                        <span>Tap when the meal is packed and ready for the trekker.</span>
                      </div>
                      <Button 
                        onClick={() => handleOneTapUpdate(order.id, order.status)}
                        disabled={actionLoading === order.id}
                        className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black h-12 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-[1.02] transition-all"
                      >
                        {actionLoading === order.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <> <Bike className="w-4 h-4 mr-2"/> Ready for Pickup </>}
                      </Button>
                    </div>
                  )}

                  {order.status === 'out_for_delivery' && (
                    <Button 
                      onClick={() => handleOneTapUpdate(order.id, order.status)}
                      disabled={actionLoading === order.id}
                      className="w-full bg-green-500 hover:bg-green-400 text-white font-black h-12 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-[1.02] transition-all"
                    >
                      {actionLoading === order.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <> <CheckCircle2 className="w-4 h-4 mr-2"/> Completed </>}
                    </Button>
                  )}
                </div>
              </div>

            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
