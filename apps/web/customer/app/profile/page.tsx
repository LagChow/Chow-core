"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Clock, LogOut, Settings, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/hooks/use-user';
import { PushNotificationSettings } from '@/components/push-notification-settings';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setOrdersLoading(true);
    fetch('/api/orders')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active && Array.isArray(data)) {
          setOrders(data);
        }
      })
      .catch(() => { })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-24 font-sans selection:bg-accent selection:text-black">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-base font-bold">My Profile</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-6">

        {/* Profile Card */}
        <Card className="bg-card border border-white/5 rounded-3xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="flex items-center gap-5 relative z-10">
            <Avatar className="h-20 w-20 ring-4 ring-background shadow-xl">
              <AvatarFallback className="bg-red-500 text-white text-3xl font-bold">
                {user.name ? (user.name.trim().split(' ').length >= 2 ? (user.name.trim().split(' ')[0][0] + user.name.trim().split(' ')[1][0]) : user.name.trim().substring(0, 2)).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-black tracking-tight">{user.name || 'User'}</h2>
              <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                {user.email}
                {user.isStudent && (
                  <span className="bg-accent/20 text-accent text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">Student</span>
                )}
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button variant="outline" className="w-full h-14 justify-between bg-black/40 hover:bg-white/5 border-white/10 rounded-2xl px-5 text-left">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="font-bold">Account Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button variant="outline" className="w-full h-14 justify-between bg-black/40 hover:bg-white/5 border-white/10 rounded-2xl px-5 text-left">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <span className="font-bold">Payment Methods</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Button>
          <PushNotificationSettings />
        </div>

        {/* Order History */}
        <div>
          <h3 className="font-black text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Recent Orders
          </h3>

          {ordersLoading ? (
            <Card className="bg-black/40 border border-white/5 rounded-2xl p-6 text-center text-muted-foreground text-sm">
              Loading your orders...
            </Card>
          ) : orders.length === 0 ? (
            <Card className="bg-black/40 border border-white/5 rounded-2xl p-6 text-center text-muted-foreground text-sm">
              No orders placed yet.
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => {
                const grossTotal = (order.totalAmount || 0) + (order.deliveryFee || 0) + (order.convenienceFee || 0);
                const itemsSummary = Array.isArray(order.items) && order.items.length > 0
                  ? order.items.map((oi: any) => `${oi.quantity}x ${oi.item?.name || 'Item'}`).join(', ')
                  : 'Order items';
                const formattedDate = order.createdAt
                  ? new Date(order.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <Card
                    key={order.id}
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="bg-black/40 border border-white/5 hover:border-white/10 transition-colors rounded-2xl p-5 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-base">{order.vendor?.name || 'Campus Vendor'}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{formattedDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-base">₦{grossTotal.toLocaleString()}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 mt-1 ${order.status === 'delivered' ? 'bg-green-500/20 text-green-500' :
                            order.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                              'bg-accent/20 text-accent'
                          }`}>
                          {order.status === 'delivered' && <CheckCircle2 className="w-3 h-3" />}
                          {String(order.status || 'pending').replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate pr-4">
                        {itemsSummary}
                      </p>
                      <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Order
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <Button
            onClick={() => router.push('/orders')}
            variant="ghost"
            className="w-full mt-4 text-muted-foreground hover:text-white font-bold h-12 rounded-xl"
          >
            View All Orders
          </Button>
        </div>

        {/* Logout */}
        <div className="pt-8 pb-4">
          <Button onClick={handleLogout} variant="ghost" className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 font-bold h-14 rounded-2xl text-base">
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>

      </div>
    </main>
  );
}
