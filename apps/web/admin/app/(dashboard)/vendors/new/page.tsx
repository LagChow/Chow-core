import React from 'react';
import { db } from '@lagchow/database';
import { vendors } from '@lagchow/database/src/schema';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default function OnboardVendorPage() {
  
  async function createVendor(formData: FormData) {
    'use server';
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    
    // Bank Account details
    const bankName = formData.get('bankName') as string;
    const accountName = formData.get('accountName') as string;
    const accountNumber = formData.get('accountNumber') as string;
    const bankAccount = { bankName, accountName, accountNumber };

    // Shop Details
    const shopDetails = formData.get('shopDetails') as string;

    // Generate a simple slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
    
    await db.insert(vendors).values({
      name,
      email,
      phone,
      slug,
      coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000',
      rating: '5.0',
      reviews: '0',
      deliveryTime: '20-30 min',
      preparationTime: 15,
      distance: shopDetails || '1.2 km', // Map shop details to distance/location string
      deliveryFee: '500',
      minOrder: '1000',
      status: 'active',
      bankAccount
    });

    redirect('/vendors');
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full pb-12">
      <div className="flex items-center gap-4">
        <Link href="/vendors" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Onboard Vendor</h1>
          <p className="text-sm text-muted-foreground mt-1">Add a new restaurant partner to LagChow.</p>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-2xl p-8">
        <form action={createVendor} className="flex flex-col gap-8">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-black border-b border-white/10 pb-2">1. Basic Information</h3>
            
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Business Name</label>
              <input 
                required 
                name="name"
                type="text" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent" 
                placeholder="e.g. Olaiya Foods" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Contact Email</label>
              <input 
                required 
                name="email"
                type="email" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent" 
                placeholder="hello@olaiyafoods.com" 
              />
              <p className="text-xs text-muted-foreground mt-2">The vendor will use this email to log in.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Phone Number</label>
              <input 
                required 
                name="phone"
                type="tel" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent" 
                placeholder="08012345678" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Shop Details & Location</label>
              <textarea 
                required 
                name="shopDetails"
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent resize-none" 
                placeholder="e.g. Shop 42, New Hall Shopping Complex. We sell rice and pasta." 
              />
            </div>
          </div>

          {/* Section 2: Bank Details */}
          <div className="space-y-6">
            <h3 className="text-lg font-black border-b border-white/10 pb-2">2. Bank Account Details</h3>
            
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Bank Name</label>
              <input 
                required 
                name="bankName"
                type="text" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent" 
                placeholder="e.g. GTBank" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Account Name</label>
              <input 
                required 
                name="accountName"
                type="text" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent" 
                placeholder="e.g. Olaiya Foods Enterprise" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Account Number</label>
              <input 
                required 
                name="accountNumber"
                type="text" 
                pattern="[0-9]{10}"
                maxLength={10}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent" 
                placeholder="0123456789" 
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-accent text-black px-6 py-4 rounded-xl font-black tracking-wider uppercase mt-4 hover:scale-[1.02] transition-transform"
          >
            Create Vendor
          </button>
        </form>
      </div>
    </div>
  );
}
