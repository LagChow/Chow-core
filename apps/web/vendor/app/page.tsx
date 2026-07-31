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

  const [vendorStatus, setVendorStatus] = useState<any>({
    status: 'Available',
    color: 'green',
    demand: 'Low',
    time: '15-25 min'
  });
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const id = localStorage.getItem('vendorId');
    if (!id) {
      router.replace('/login');
    } else {
      setVendorId(id);
      // Fetch initial vendor status
      fetch(`/api/vendors/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.vendor?.queueStatus) {
            setVendorStatus(data.vendor.queueStatus);
          }
        })
        .catch(console.error);
    }
  }, [router]);

  if (!isClient || !vendorId) return null;

  const handleLogout = () => {
    localStorage.removeItem('vendorId');
    router.replace('/login');
  };

  const updateQueueStatus = async (field: 'status' | 'demand', value: string) => {
    if (!vendorId) return;
    setStatusLoading(true);
    try {
      let newStatus = { ...vendorStatus, [field]: value };
      
      // Auto-adjust color and time based on status/demand
      if (field === 'status') {
        if (value === 'Available') { newStatus.color = 'green'; newStatus.time = '15-25 min'; }
        if (value === 'Moderate') { newStatus.color = 'yellow'; newStatus.time = '25-35 min'; }
        if (value === 'Rush Hour') { newStatus.color = 'red'; newStatus.time = '45+ min'; }
      }

      const res = await fetch(`/api/vendors/${vendorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueStatus: newStatus })
      });
      if (res.ok) {
        setVendorStatus(newStatus);
      }
    } catch (e) {
      console.error('Failed to update status', e);
    } finally {
      setStatusLoading(false);
    }
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

        {/* Live Status Controls - Desktop */}
        <div className="p-4 mx-4 mb-2 bg-white/5 border border-white/10 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Status</span>
            {statusLoading && <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] text-white/50 font-semibold uppercase">Queue</label>
            <select 
              value={vendorStatus?.status || 'Available'}
              onChange={(e) => updateQueueStatus('status', e.target.value)}
              disabled={statusLoading}
              className="w-full bg-black/40 border border-white/10 rounded-lg text-sm p-2 text-white outline-none focus:border-accent"
            >
              <option value="Available">🟢 Available</option>
              <option value="Moderate">🟡 Moderate</option>
              <option value="Rush Hour">🔴 Rush Hour</option>
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] text-white/50 font-semibold uppercase">Demand</label>
            <select 
              value={vendorStatus?.demand || 'Low'}
              onChange={(e) => updateQueueStatus('demand', e.target.value)}
              disabled={statusLoading}
              className="w-full bg-black/40 border border-white/10 rounded-lg text-sm p-2 text-white outline-none focus:border-accent"
            >
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
              <option value="Very High">Very High</option>
            </select>
          </div>
        </div>

        <div className="p-4 space-y-2 mt-auto">
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
      <div className="md:hidden sticky top-0 z-50 bg-black border-b border-white/10 p-4 flex flex-col gap-3 shadow-2xl">
        <div className="flex items-center justify-between">
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
        
        {/* Mobile Live Status Mini-Controls */}
        <div className="flex gap-2">
          <select 
            value={vendorStatus?.status || 'Available'}
            onChange={(e) => updateQueueStatus('status', e.target.value)}
            disabled={statusLoading}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg text-xs p-2 text-white outline-none focus:border-accent appearance-none"
          >
            <option value="Available">🟢 Available</option>
            <option value="Moderate">🟡 Moderate</option>
            <option value="Rush Hour">🔴 Rush Hour</option>
          </select>
          <select 
            value={vendorStatus?.demand || 'Low'}
            onChange={(e) => updateQueueStatus('demand', e.target.value)}
            disabled={statusLoading}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg text-xs p-2 text-white outline-none focus:border-accent appearance-none"
          >
            <option value="Low">Low Demand</option>
            <option value="Moderate">Mod. Demand</option>
            <option value="High">High Demand</option>
            <option value="Very High">Peak Demand</option>
          </select>
        </div>
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
      <main className="flex-1 min-w-0 overflow-y-auto pb-32 md:pb-0 relative bg-background">
        {activeTab === 'orders' && <OrdersView vendorId={vendorId} />}
        {activeTab === 'menu' && <MenuView vendorId={vendorId} />}
        {activeTab === 'analytics' && <AnalyticsView vendorId={vendorId} />}
      </main>
    </div>
  );
}
