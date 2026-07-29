"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function OnboardVendorDialog({ onVendorAdded }: { onVendorAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [shopDetails, setShopDetails] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          bankName,
          accountName,
          accountNumber,
          shopDetails,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create vendor');
      }

      setOpen(false);
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setBankName('');
      setAccountName('');
      setAccountNumber('');
      setShopDetails('');

      if (onVendorAdded) {
        onVendorAdded();
      }
    } catch (err: any) {
      console.error(err);
      setError('Error onboarding vendor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent text-black font-bold shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:bg-accent/90">
          Onboard New Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card border-white/10 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Onboard a Vendor</DialogTitle>
            <DialogDescription>
              Fill out these details to create a new vendor account. The status will default to "Pending First Login".
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm font-medium border border-red-500/20 mt-4 mx-4 mb-0">
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4">
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Business Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3 bg-background border-white/10"
                placeholder="E.g., Olaiya Foods"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3 bg-background border-white/10"
                placeholder="vendor@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone Number
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="col-span-3 bg-background border-white/10"
                placeholder="08012345678"
                required
              />
            </div>

            <hr className="border-white/5 my-2" />
            <h4 className="text-sm font-semibold text-muted-foreground ml-1">Bank Account</h4>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bankName" className="text-right">
                Bank Name
              </Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="col-span-3 bg-background border-white/10"
                placeholder="E.g., Guaranty Trust Bank"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountName" className="text-right">
                Account Name
              </Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="col-span-3 bg-background border-white/10"
                placeholder="Olaiya Foods Ltd"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountNumber" className="text-right">
                Account No.
              </Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="col-span-3 bg-background border-white/10"
                placeholder="0123456789"
                required
              />
            </div>

            <hr className="border-white/5 my-2" />
            <h4 className="text-sm font-semibold text-muted-foreground ml-1">Location Details</h4>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shopDetails" className="text-right">
                Shop Details
              </Label>
              <Input
                id="shopDetails"
                value={shopDetails}
                onChange={(e) => setShopDetails(e.target.value)}
                className="col-span-3 bg-background border-white/10"
                placeholder="E.g., Shop 4, New Hall, UNILAG"
                required
              />
            </div>

          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-accent text-black font-bold hover:bg-accent/90"
            >
              {loading ? 'Creating...' : 'Create Vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
