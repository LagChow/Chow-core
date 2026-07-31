"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Store, Mail, KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function VendorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/otp', { action: 'send', email });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/otp', { action: 'verify', email, otp });
      // If successful, we can save vendorId to localStorage or rely on cookies
      // Assuming API sets an HttpOnly cookie or returns vendorId
      if (res.data.vendorId) {
        localStorage.setItem('vendorId', res.data.vendorId);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="z-10 w-full max-w-md space-y-8 relative">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-accent">LagChow<span className="text-foreground">.</span></h1>
          <h1 className="text-3xl font-black tracking-tight">Merchant Portal</h1>
          <p className="text-muted-foreground">Sign in to manage your LagChow store.</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-xl border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          {error && (
            <div className="bg-red-500/10 text-red-500 text-sm font-semibold p-3 rounded-xl border border-red-500/20 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/80 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="vendor@lagchow.com"
                    className="w-full bg-black/40 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full h-12 bg-accent text-black font-black text-base rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                  <>Continue <ArrowRight className="w-4 h-4 ml-2 inline" /></>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="space-y-2">
                <label className="text-sm font-bold text-white/80 uppercase tracking-wider">Authentication Code</label>
                <p className="text-xs text-muted-foreground mb-4">We sent a secure code to {email}</p>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    placeholder="000000"
                    className="w-full bg-black/40 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-center tracking-[0.5em] font-mono text-lg"
                    maxLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full h-12 bg-accent text-black font-black text-base rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sign In'}
              </Button>
              
              <button 
                type="button" 
                onClick={() => setStep('email')}
                className="w-full text-sm text-muted-foreground font-semibold hover:text-white transition-colors"
              >
                Use a different email
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
