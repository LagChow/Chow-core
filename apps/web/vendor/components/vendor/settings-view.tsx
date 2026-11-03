"use client";

import React, { useEffect, useState } from 'react';
import { Save, Building, CreditCard, UserCircle, Store, AlertCircle } from 'lucide-react';

interface SettingsViewProps {
  vendorId: string;
}

export default function SettingsView({ vendorId }: SettingsViewProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendorData, setVendorData] = useState<any>(null);

  const [bankAccount, setBankAccount] = useState({
    bankName: '',
    accountName: '',
    accountNumber: ''
  });
  
  const [storeStatus, setStoreStatus] = useState('offline');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    fetchVendor();
  }, [vendorId]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/vendors/${vendorId}`);
      if (res.ok) {
        const data = await res.json();
        setVendorData(data.vendor);
        if (data.vendor.bankAccount) {
          setBankAccount(data.vendor.bankAccount);
        }
        setStoreStatus(data.vendor.status || 'offline');
        setPhone(data.vendor.phone || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccount,
          status: storeStatus,
          phone
        })
      });
      if (res.ok) {
        // Show success maybe a toast
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h2 className="text-3xl font-black tracking-tight mb-2">Store Settings</h2>
        <p className="text-muted-foreground">Manage your payout details and store operating status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Payout Details Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-xl font-bold">Payout Details</h3>
          </div>
          
          <div className="space-y-4 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-3 h-3" /> Bank Name
              </label>
              <input
                type="text"
                value={bankAccount.bankName}
                onChange={(e) => setBankAccount({ ...bankAccount, bankName: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-accent transition-colors"
                placeholder="e.g. Guarantee Trust Bank"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <UserCircle className="w-3 h-3" /> Account Name
              </label>
              <input
                type="text"
                value={bankAccount.accountName}
                onChange={(e) => setBankAccount({ ...bankAccount, accountName: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-accent transition-colors"
                placeholder="e.g. Chow Merchant Ltd"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-3 h-3" /> Account Number
              </label>
              <input
                type="text"
                value={bankAccount.accountNumber}
                onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-accent transition-colors"
                placeholder="0000000000"
              />
            </div>
          </div>
        </div>

        {/* Operating Status Card */}
        <div className="space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Store className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-xl font-bold">Operating Status</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-black/40 border border-white/10 rounded-xl flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <p className="text-sm text-white/70">
                  Toggle your store status. When set to <span className="font-bold text-white">Active</span>, customers can see your store and place orders.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Current Status</label>
                <select
                  value={storeStatus}
                  onChange={(e) => setStoreStatus(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-accent transition-colors"
                >
                  <option className="bg-black text-white" value="active">🟢 Active (Open for Business)</option>
                  <option className="bg-black text-white" value="offline">🔴 Offline (Closed)</option>
                  <option className="bg-black text-white" value="suspended">🟡 Suspended</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-accent transition-colors"
                  placeholder="+234..."
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-accent text-black rounded-xl font-black text-lg hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.3)] disabled:opacity-70 disabled:hover:scale-100"
          >
            {saving ? (
              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-5 h-5" /> Save All Settings
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
