"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Settings, PieChart, ShoppingBag, MenuSquare, HeadphonesIcon, LogOut } from 'lucide-react';

import OrdersView from '@/components/vendor/orders-view';
import MenuView from '@/components/vendor/menu-view';
import AnalyticsView from '@/components/vendor/analytics-view';

type Tab = 'orders' | 'menu' | 'analytics';

export default function VendorDashboard() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const id = localStorage.getItem('vendorId');
    if (!id) {
      router.replace('/login');
    } else {
      setVendorId(id);
    }
  }, [router]);

  if (!isClient || !vendorId) return null;

  const handleLogout = () => {
    localStorage.removeItem('vendorId');
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-card/30 border-r border-white/5 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-white/5">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
              LagChow.
            </div>
            <h1 className="font-black text-xl tracking-tight leading-none">Merchant App</h1>
          </div>
          
          <nav className="p-4 space-y-2">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
            >
              <ShoppingBag className="w-5 h-5" /> Orders
            </button>
            <button 
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'menu' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
            >
              <MenuSquare className="w-5 h-5" /> Menu
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'analytics' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
            >
              <PieChart className="w-5 h-5" /> Analytics
            </button>
          </nav>
        </div>

        <div className="p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
            <HeadphonesIcon className="w-5 h-5" /> Support
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Store className="w-4 h-4 text-black" />
          </div>
          <h1 className="font-black text-lg tracking-tight">Merchant App</h1>
        </div>
        <button onClick={handleLogout} className="text-red-500 p-2">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Bottom Bar Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-white/5 p-2 flex justify-around pb-6">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center p-2 ${activeTab === 'orders' ? 'text-accent' : 'text-muted-foreground'}`}
        >
          <ShoppingBag className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase">Orders</span>
        </button>
        <button 
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center p-2 ${activeTab === 'menu' ? 'text-accent' : 'text-muted-foreground'}`}
        >
          <MenuSquare className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase">Menu</span>
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center p-2 ${activeTab === 'analytics' ? 'text-accent' : 'text-muted-foreground'}`}
        >
          <PieChart className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase">Stats</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-32 md:pb-0 relative">
        {activeTab === 'orders' && <OrdersView vendorId={vendorId} />}
        {activeTab === 'menu' && <MenuView vendorId={vendorId} />}
        {activeTab === 'analytics' && <AnalyticsView vendorId={vendorId} />}
      </main>
    </div>
  );
}
