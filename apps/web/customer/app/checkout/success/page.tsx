"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { CheckCircle2, Home, ArrowRight, Loader2, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const orderId = searchParams.get('orderId');
  const reference = searchParams.get('reference') || searchParams.get('paymentReference');

  const [isVerifying, setIsVerifying] = useState(Boolean(reference));
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'failed' | null>(
    reference ? 'pending' : 'paid'
  );
  const [amountPaid, setAmountPaid] = useState<number | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!reference) return;

    let pollCount = 0;
    const maxPolls = 6;
    let timer: NodeJS.Timeout;

    const verify = async () => {
      try {
        const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paid) {
            setPaymentStatus('paid');
            setAmountPaid(data.amountPaid);
            setTxRef(data.transactionReference);
            setIsVerifying(false);
            return;
          }
        }
      } catch (err) {
        console.error('Payment verification error:', err);
      }

      pollCount++;
      if (pollCount < maxPolls) {
        timer = setTimeout(verify, 3000);
      } else {
        setIsVerifying(false);
        setPaymentStatus('pending');
      }
    };

    verify();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [reference]);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans selection:bg-accent selection:text-black relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="max-w-md w-full animate-in zoom-in-95 fade-in duration-500">
        <div className="flex flex-col items-center text-center mb-8">
          {paymentStatus === 'paid' && (
            <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)] relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
              <CheckCircle2 className="w-10 h-10 relative z-10" />
            </div>
          )}

          {paymentStatus === 'pending' && isVerifying && (
            <div className="w-20 h-20 bg-accent/20 text-accent rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(250,204,21,0.3)] relative">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          )}

          {paymentStatus === 'pending' && !isVerifying && (
            <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.3)] relative">
              <Clock className="w-10 h-10" />
            </div>
          )}

          <h1 className="text-3xl font-black mb-2">
            {paymentStatus === 'paid'
              ? 'Payment Confirmed! 🎉'
              : isVerifying
              ? 'Verifying Payment...'
              : 'Order Placed!'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {paymentStatus === 'paid'
              ? `Your order ${orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : ''} has been received and sent to the kitchen.`
              : isVerifying
              ? 'Checking status with Monnify gateway...'
              : 'Your payment is processing or awaiting confirmation.'}
          </p>
        </div>

        <Card className="bg-card/60 backdrop-blur-xl border-white/10 rounded-3xl p-6 shadow-2xl mb-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
            <span className="text-muted-foreground uppercase font-bold tracking-wider">Payment Status</span>
            <span
              className={`font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                paymentStatus === 'paid'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {paymentStatus === 'paid' ? 'Paid (Monnify)' : isVerifying ? 'Verifying...' : 'Processing'}
            </span>
          </div>

          {reference && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Payment Ref</span>
              <span className="font-mono text-white font-semibold truncate max-w-[180px]">{reference}</span>
            </div>
          )}

          {txRef && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Monnify Tx ID</span>
              <span className="font-mono text-white/80 truncate max-w-[180px]">{txRef}</span>
            </div>
          )}

          {amountPaid && (
            <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
              <span className="text-muted-foreground font-semibold">Amount Paid</span>
              <span className="font-black text-accent text-lg">₦{amountPaid.toLocaleString()}</span>
            </div>
          )}

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-2.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
            <span>Real-time webhook auto-settlement verified by Monnify.</span>
          </div>
        </Card>

        <div className="space-y-3">
          {orderId && (
            <Button
              onClick={() => router.push(`/orders/${orderId}`)}
              className="w-full bg-accent hover:bg-accent/90 text-black font-black h-14 rounded-2xl shadow-[0_10px_30px_rgba(250,204,21,0.3)] transition-transform hover:scale-[1.02] text-base gap-2"
            >
              Track Order Live <ArrowRight className="w-5 h-5" />
            </Button>
          )}

          <Button
            onClick={() => router.push('/orders')}
            variant="outline"
            className="w-full bg-white/5 border-white/10 hover:bg-white/10 h-14 rounded-2xl font-bold transition-all text-base gap-2"
          >
            <Home className="w-4 h-4" /> View All Orders
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
