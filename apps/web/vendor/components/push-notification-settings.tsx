"use client";

import React, { useState } from 'react';
import { Bell, BellOff, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export function PushNotificationSettings() {
  const { isSupported, permission, isSubscribing, subscribeToPush } = usePushNotifications();
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  if (!isSupported) {
    return null; // Don't show anything if push isn't supported in this browser
  }

  const handleSubscribe = async () => {
    if (permission === 'granted') return; // Already granted, maybe we just want to test
    await subscribeToPush();
  };

  const handleTestPush = async () => {
    setTestStatus('loading');
    try {
      const res = await fetch('/api/push/test', { method: 'POST' });
      if (res.ok) {
        setTestStatus('success');
        setTimeout(() => setTestStatus('idle'), 2000);
      } else {
        setTestStatus('error');
        setTimeout(() => setTestStatus('idle'), 2000);
      }
    } catch (e) {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 2000);
    }
  };

  return (
    <div className="space-y-3 mt-3">
      {permission !== 'granted' ? (
        <Button 
          variant="outline" 
          onClick={handleSubscribe}
          disabled={isSubscribing}
          className="w-full h-14 justify-between bg-black/40 hover:bg-white/5 border-white/10 rounded-2xl px-5 text-left"
        >
          <div className="flex items-center gap-3">
            <BellOff className="w-5 h-5 text-muted-foreground" />
            <span className="font-bold">Enable Notifications</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {isSubscribing ? 'Enabling...' : 'Off'}
          </span>
        </Button>
      ) : (
        <Button 
          variant="outline" 
          onClick={handleTestPush}
          disabled={testStatus === 'loading'}
          className="w-full h-14 justify-between bg-black/40 hover:bg-white/5 border-white/10 rounded-2xl px-5 text-left"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-accent" />
            <span className="font-bold">Notifications Enabled</span>
          </div>
          <span className="text-xs text-accent">
            {testStatus === 'loading' ? 'Testing...' : testStatus === 'success' ? 'Sent!' : testStatus === 'error' ? 'Failed' : 'Send Test'}
          </span>
        </Button>
      )}
    </div>
  );
}
