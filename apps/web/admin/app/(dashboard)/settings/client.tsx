'use client';

import React, { useTransition } from 'react';
import { ShieldAlert, Info, BellRing, Settings, Smartphone, Loader2 } from 'lucide-react';
import { toggleMaintenanceMode, togglePauseOrders, forceOfflineRiders, saveSupportContacts, sendGlobalBroadcast } from './actions';

export function SettingsClient({ initialSettings }: { initialSettings: Record<string, any> }) {
  const [isPending, startTransition] = useTransition();

  const maintenanceMode = initialSettings['maintenance_mode'] || false;
  const pauseOrders = initialSettings['pause_orders'] || false;
  const contacts = initialSettings['support_contacts'] || { customerSupport: '', vendorSupport: '' };

  const handleMaintenanceToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    startTransition(async () => {
      await toggleMaintenanceMode(checked);
    });
  };

  const handlePauseOrdersToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    startTransition(async () => {
      await togglePauseOrders(checked);
    });
  };

  const handleForceOffline = async () => {
    if (confirm("Are you sure you want to force all riders offline?")) {
      startTransition(async () => {
        await forceOfflineRiders();
      });
    }
  };

  const handleSaveContacts = (formData: FormData) => {
    startTransition(async () => {
      await saveSupportContacts(
        formData.get('customerSupport') as string, 
        formData.get('vendorSupport') as string
      );
    });
  };

  const handleBroadcast = (formData: FormData) => {
    startTransition(async () => {
      await sendGlobalBroadcast(
        formData.get('title') as string,
        formData.get('message') as string
      );
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-4xl relative">
      {isPending && (
        <div className="absolute top-0 right-0 z-50 bg-black/80 text-accent font-bold px-4 py-2 rounded-xl flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Saving...
        </div>
      )}

      <div>
        <h1 className="text-3xl font-black tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Global configurations and master control switches for the LagChow ecosystem.
        </p>
      </div>

      {/* Emergency Kill Switches */}
      <div className="bg-card border border-red-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <ShieldAlert className="w-32 h-32 text-red-500" />
        </div>
        
        <h3 className="font-bold text-lg text-red-500 mb-2">Emergency Controls</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
          Use these switches only in extreme circumstances (e.g., severe weather, platform outages).
        </p>

        <div className="space-y-4 max-w-xl relative z-10">
          
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div>
              <h4 className="font-bold text-sm text-red-400">Maintenance Mode (Full Kill Switch)</h4>
              <p className="text-xs text-red-400/80 mt-1">Instantly shuts down the entire platform for customers and vendors.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={maintenanceMode} onChange={handleMaintenanceToggle} className="sr-only peer" disabled={isPending} />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
            <div>
              <h4 className="font-bold text-sm text-white">Pause All Orders</h4>
              <p className="text-xs text-muted-foreground mt-1">Prevents any new orders from being placed. Current orders continue.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={pauseOrders} onChange={handlePauseOrdersToggle} className="sr-only peer" disabled={isPending} />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
            <div>
              <h4 className="font-bold text-sm text-white">Force Offline (Riders)</h4>
              <p className="text-xs text-muted-foreground mt-1">Instantly marks all campus runners as offline.</p>
            </div>
            <button onClick={handleForceOffline} disabled={isPending} className="bg-red-500/20 text-red-500 hover:bg-red-500/30 font-bold px-4 py-2 rounded-lg text-sm transition-colors">
              Force Offline
            </button>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <form action={handleSaveContacts} className="bg-card border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">App Support Contacts</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Customer Support Line</label>
              <input name="customerSupport" type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" defaultValue={contacts.customerSupport} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Vendor Support Email</label>
              <input name="vendorSupport" type="email" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" defaultValue={contacts.vendorSupport} required />
            </div>
            <button type="submit" disabled={isPending} className="w-full bg-white/10 text-white px-4 py-3 rounded-xl font-bold mt-2 hover:bg-white/20 transition-colors">
              Save Contacts
            </button>
          </div>
        </form>

        <form action={handleBroadcast} className="bg-card border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
              <BellRing className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Push Notifications</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Send a global push notification to all active devices (Customers, Vendors, Riders).</p>
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Message Title</label>
              <input name="title" type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" placeholder="e.g., Free Delivery Today!" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Message Body</label>
              <textarea name="message" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm h-24 resize-none" placeholder="Enter your message..." required></textarea>
            </div>
            <button type="submit" disabled={isPending} className="w-full bg-accent text-black px-4 py-3 rounded-xl font-bold mt-2 hover:scale-[1.02] transition-transform">
              Send Global Broadcast
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
