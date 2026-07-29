"use client";

import React from "react";
import { useCart } from "@/lib/cart-context";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { AuthModal } from "./auth-modal";

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]" 
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Slide-out Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-card border-l border-white/10 z-[100] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-card/50 backdrop-blur-xl">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-accent" />
            Your Order
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)} className="rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content (Items) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <ShoppingBag className="w-16 h-16 opacity-20" />
              <p className="font-semibold text-lg">Your cart is empty.</p>
              <Button variant="outline" onClick={() => setIsCartOpen(false)} className="mt-2 border-white/20">
                Browse food
              </Button>
            </div>
          ) : (
            <>
              {/* Vendor Info Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  {items[0].vendorName}
                </span>
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2 text-xs">
                  <Trash2 className="w-3 h-3 mr-1" /> Clear
                </Button>
              </div>

              {items.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm leading-tight line-clamp-1">{item.name}</h4>
                    <p className="text-accent font-black mt-1">₦{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-1">
                    <button onClick={() => removeItem(item.id)} className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-muted-foreground transition-colors">
                      {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3" />}
                    </button>
                    <span className="font-bold text-sm min-w-[12px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer (Checkout) */}
        {items.length > 0 && (
          <div className="p-6 border-t border-white/5 bg-card/50 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground font-semibold">Subtotal</span>
              <span className="font-black text-xl">₦{totalAmount.toLocaleString()}</span>
            </div>
            <Button 
              onClick={() => {
                if (!user) {
                  setIsAuthModalOpen(true);
                } else {
                  setIsCartOpen(false);
                  router.push("/checkout");
                }
              }}
              className="w-full bg-accent hover:bg-accent/90 text-black font-black h-14 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all text-lg"
            >
              Checkout
            </Button>
          </div>
        )}
      </div>

      {/* Auth Modal if user is not logged in */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
