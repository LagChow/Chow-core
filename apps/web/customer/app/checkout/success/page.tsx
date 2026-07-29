"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { CheckCircle2, Copy, Home, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { clearCart, totalAmount } = useCart();
  const [copied, setCopied] = useState(false);
  const [amountToPay, setAmountToPay] = useState(0);

  // Clear cart on mount and save the total amount for the transfer instructions
  useEffect(() => {
    if (totalAmount > 0) {
      setAmountToPay(totalAmount);
      clearCart();
    }
  }, [totalAmount, clearCart]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText("0123456789");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans selection:bg-accent selection:text-black relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="max-w-md w-full animate-in zoom-in-95 fade-in duration-500">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)] relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
            <CheckCircle2 className="w-10 h-10 relative z-10" />
          </div>
          <h1 className="text-3xl font-black mb-2">Order Placed!</h1>
          <p className="text-muted-foreground text-sm">Your order #LAG-{Math.floor(1000 + Math.random() * 9000)} is pending payment confirmation.</p>
        </div>

        <Card className="bg-card/60 backdrop-blur-xl border-white/10 rounded-3xl p-6 shadow-2xl mb-8">
          <h3 className="font-bold text-center mb-4 uppercase tracking-widest text-xs text-muted-foreground">Transfer Instructions</h3>
          
          <div className="space-y-4">
            <div className="bg-black/40 rounded-xl p-4 border border-white/5 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Amount</p>
                <p className="font-black text-xl text-accent">₦{(amountToPay || 5000).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative group">
              <p className="text-xs text-muted-foreground mb-1">Bank Name</p>
              <p className="font-bold">Guaranty Trust Bank (GTB)</p>
            </div>

            <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative group">
              <p className="text-xs text-muted-foreground mb-1">Account Number</p>
              <div className="flex justify-between items-center">
                <p className="font-black text-xl tracking-widest">0123456789</p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={copyToClipboard}
                  className="h-8 w-8 rounded-full hover:bg-white/10 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground group-hover:text-white" />}
                </Button>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative group">
              <p className="text-xs text-muted-foreground mb-1">Account Name</p>
              <p className="font-bold">LagChow Technologies Ltd</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-accent/10 rounded-xl border border-accent/20">
            <p className="text-xs text-center text-accent/80 font-medium">
              We'll confirm your payment within 2 minutes and start preparing your order.
            </p>
          </div>
        </Card>

        <Button 
          onClick={() => router.push("/")}
          variant="outline"
          className="w-full bg-white/5 border-white/10 hover:bg-white/10 h-14 rounded-xl font-bold transition-all text-base gap-2"
        >
          <Home className="w-4 h-4" /> Return to Home
        </Button>
      </div>
    </main>
  );
}
