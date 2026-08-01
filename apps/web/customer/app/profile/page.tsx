"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Clock, LogOut, Settings, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/hooks/use-user';
import { PushNotificationSettings } from '@/components/push-notification-settings';

const MOCK_ORDERS = [
  {
    id: "ORD-1092",
    date: "Today, 1:45 PM",
    vendor: "Foodician",
    status: "delivered",
    total: 3500,
    items: "2x Jollof Rice, 1x Plantain"
  },
  {
    id: "ORD-1088",
    date: "Yesterday, 6:30 PM",
    vendor: "Olaiya Foods",
    status: "delivered",
    total: 2100,
    items: "1x Amala (3 wraps), 2x Beef"
  },
  {
    id: "ORD-0941",
    date: "14 Jul 2026, 2:15 PM",
    vendor: "Korede Spaghetti",
    status: "cancelled",
    total: 1500,
    items: "1x Stir-fry Pasta"
  }
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Clear the user from our hook context locally if needed, but reloading/redirecting is fine
      router.push('/');
      window.location.reload(); // Ensure state is reset completely
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
          
          <div className="space-y-3">
            {MOCK_ORDERS.map((order) => (
              <Card key={order.id} className="bg-black/40 border border-white/5 hover:border-white/10 transition-colors rounded-2xl p-5 cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-base">{order.vendor}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-base">₦{order.total.toLocaleString()}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 mt-1 ${
                      order.status === 'delivered' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {order.status === 'delivered' && <CheckCircle2 className="w-3 h-3" />}
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate pr-4">
                    {order.items}
                  </p>
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    Reorder
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          
          <Button variant="ghost" className="w-full mt-4 text-muted-foreground hover:text-white font-bold h-12 rounded-xl">
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
