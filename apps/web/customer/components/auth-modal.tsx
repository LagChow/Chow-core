"use client";

import React, { useState } from 'react';
import { X, Mail, ArrowRight, CheckCircle2, AlertCircle, Building2, MapPin, User, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

const UNILAG_HALLS = [
  "New Hall (Eni-Njoku)",
  "New Hall (Sodiende)",
  "New Hall (Makama)",
  "New Hall (Fagunwa)",
  "New Hall (Madam Tinubu MTH)",
  "Jaja",
  "Moremi",
  "Mariere",
  "Biobaku",
  "Amina",
  "Kofo",
  "Elkanemi",
  "Gbaja",
  "Honours",
  "Women Society",
  "Other"
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [isStudent, setIsStudent] = useState(true);
  const [location, setLocation] = useState('');

  if (!isOpen) return null;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setStep(2);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send code');
      }
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 5) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.needsProfileCompletion) {
          setStep(3);
        } else {
          window.location.reload(); // Refresh to update session state
        }
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, isStudent, location })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <Card className="relative w-full max-w-md bg-background/95 backdrop-blur-xl border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="p-8 relative z-10">
          
          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-2">Welcome to LagChow</h2>
                <p className="text-muted-foreground text-sm">Enter your email to sign in or create an account. No passwords needed.</p>
              </div>

              {error && <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@unilag.edu.ng" 
                      className="pl-10 h-12 bg-black/40 border-white/10 rounded-xl focus-visible:ring-accent font-medium" 
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button disabled={loading} type="submit" className="w-full bg-accent hover:bg-accent/90 text-black font-black h-12 rounded-xl mt-4 text-base transition-all active:scale-[0.98]">
                  {loading ? "Sending Code..." : "Continue"} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-2">Check your email</h2>
                <p className="text-muted-foreground text-sm">We sent a 6-digit code to <br/><span className="font-bold text-white">{email}</span></p>
              </div>

              {error && <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Verification Code</label>
                  <Input 
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000" 
                    maxLength={6}
                    className="h-14 bg-black/40 border-white/10 rounded-xl focus-visible:ring-accent text-center text-2xl font-black tracking-[0.5em]" 
                    required
                    autoFocus
                  />
                </div>

                <Button disabled={loading || otp.length < 5} type="submit" className="w-full bg-accent hover:bg-accent/90 text-black font-black h-12 rounded-xl mt-4 text-base transition-all active:scale-[0.98]">
                  {loading ? "Verifying..." : "Verify Code"} <CheckCircle2 className="w-4 h-4 ml-2" />
                </Button>

                <p className="text-center text-xs text-muted-foreground mt-6">
                  Didn't receive it? <button type="button" onClick={handleSendOTP} className="text-white font-bold hover:text-accent ml-1 transition-colors">Resend Code</button>
                </p>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black tracking-tight mb-1">Almost there!</h2>
                <p className="text-muted-foreground text-sm">Just a few details to get your food delivered to the right place.</p>
              </div>

              {error && <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}

              <form onSubmit={handleCompleteProfile} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe" 
                      className="pl-10 h-12 bg-black/40 border-white/10 rounded-xl focus-visible:ring-accent" 
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Are you a UNILAG student?</label>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsStudent(true)}
                      className={`flex-1 h-12 rounded-xl border-white/10 transition-colors ${isStudent ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-black/40 text-muted-foreground'}`}
                    >
                      Yes, I am
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsStudent(false)}
                      className={`flex-1 h-12 rounded-xl border-white/10 transition-colors ${!isStudent ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-black/40 text-muted-foreground'}`}
                    >
                      No, I'm not
                    </Button>
                  </div>
                </div>

                {isStudent ? (
                  <div className="space-y-1 pt-2 animate-in fade-in zoom-in-95">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Hall of Residence</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                      <select 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)} 
                        required
                        className="w-full pl-10 pr-4 h-12 bg-black/40 border border-white/10 rounded-xl focus:ring-1 focus:ring-accent outline-none appearance-none text-sm text-white"
                      >
                        <option value="" disabled className="text-muted-foreground bg-background">Select your hall</option>
                        {UNILAG_HALLS.map(hall => (
                          <option key={hall} value={hall} className="bg-background">{hall}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 animate-in fade-in zoom-in-95">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Nearby Campus Landmark</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="E.g. Faculty of Arts" 
                          className="pl-10 h-12 bg-black/40 border-white/10 rounded-xl focus-visible:ring-accent" 
                          required
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 text-xs font-medium leading-relaxed flex gap-2 items-start mt-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>LagChow delivery is strictly exclusive to the UNILAG Campus & its immediate environs. Please provide a clear on-campus landmark.</p>
                    </div>
                  </div>
                )}

                <Button disabled={loading} type="submit" className="w-full bg-accent hover:bg-accent/90 text-black font-black h-12 rounded-xl mt-6 text-base transition-all active:scale-[0.98]">
                  {loading ? "Saving..." : "Complete Setup"} <CheckCircle2 className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </div>
          )}

        </div>
      </Card>
    </div>
  );
}
