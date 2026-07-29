"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUp, CheckCircle2, Clock, Wallet, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AnalyticsView({ vendorId }: { vendorId: string }) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`/api/stats?vendorId=${vendorId}`);
        setStats(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [vendorId]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  const statCards = [
    {
      label: "Total Balance",
      value: `₦${stats?.totalBalance?.toLocaleString() || 0}`,
      icon: Wallet,
      color: "text-accent",
      bg: "bg-accent/10"
    },
    {
      label: "Completed Orders",
      value: stats?.completedOrders || 0,
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    {
      label: "Pending Orders",
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black">Performance Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">Track your business metrics and earnings.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="bg-card/40 border-white/5 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:scale-110 group-hover:opacity-100 transition-transform">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <Icon className={`w-6 h-6 ${s.color}`} />
                </div>
              </div>
              <div className="space-y-4">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <div className="text-3xl font-black">{s.value}</div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="bg-card/30 border-white/5 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-4 mt-8">
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-2">
          <TrendingUp className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-bold">Keep up the great work!</h3>
        <p className="text-muted-foreground max-w-md">Detailed charts and payout schedules will be available in the upcoming updates. For now, track your live order performance here.</p>
      </Card>
    </div>
  );
}
