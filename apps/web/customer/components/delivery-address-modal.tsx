"use client";

import React, { useState } from 'react';
import { X, Search, ShieldCheck, MapPin, Edit2, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface DeliveryAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAddress: string;
  onSelectAddress: (address: string) => void;
}

const SAVED_ADDRESSES = [
  "4b Ransome Kuti Rd, University Of Lagos, Lagos 101245, Lagos, Nigeria",
  "Erinola Salako Street, Aguda, Lagos",
  "New Hall Unilag, Akoka 101245, Lagos, Nigeria"
];

import { UNILAG_LOCATIONS } from '../lib/constants';

export function DeliveryAddressModal({ isOpen, onClose, activeAddress, onSelectAddress }: DeliveryAddressModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredAddresses = SAVED_ADDRESSES.filter(address =>
    address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const autocompleteSuggestions = searchQuery.trim() 
    ? UNILAG_LOCATIONS.filter(loc => loc.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <Card className="relative w-full max-w-md bg-background/95 backdrop-blur-xl border-white/10 rounded-[24px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 relative z-10">
          <h2 className="text-2xl font-black tracking-tight">Delivery Address</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 overflow-y-auto relative z-10 flex-1 space-y-5">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
            <Input 
              id="address-input"
              placeholder="Enter a new address" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  onSelectAddress(searchQuery.trim());
                  onClose();
                }
              }}
              className="w-full pl-12 h-14 bg-white/5 border-white/10 rounded-2xl focus-visible:ring-accent text-base"
            />
          </div>

          {/* Save new address option */}
          <Button 
            variant="outline"
            onClick={() => {
              if (searchQuery.trim()) {
                onSelectAddress(searchQuery.trim());
                onClose();
              } else {
                document.getElementById('address-input')?.focus();
              }
            }}
            className={`w-full justify-start h-14 border-accent/20 hover:border-accent/40 hover:bg-accent/5 transition-all rounded-xl ${searchQuery.trim() ? 'bg-accent/10 border-accent/40 shadow-[0_0_15px_rgba(250,204,21,0.15)]' : 'bg-transparent'}`}
          >
            <div className="flex items-center gap-3 text-accent w-full font-bold text-base">
              <ShieldCheck className="w-5 h-5" />
              {searchQuery.trim() ? "Save new address" : "Add a new address"}
            </div>
          </Button>

          {/* Autocomplete Suggestions */}
          {searchQuery.trim() && autocompleteSuggestions.length > 0 && (
            <div className="space-y-1 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-2">Campus Locations</h3>
              {autocompleteSuggestions.map((loc, idx) => (
                <div 
                  key={`auto-${idx}`} 
                  onClick={() => {
                    onSelectAddress(loc);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-4 rounded-2xl hover:bg-accent/10 border border-transparent hover:border-accent/20 transition-all cursor-pointer group"
                >
                  <MapPin className="w-5 h-5 shrink-0 text-muted-foreground group-hover:text-accent transition-colors" />
                  <p className="text-sm font-medium text-foreground/90 group-hover:text-white transition-colors">
                    {loc}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Saved Addresses List */}
          {(!searchQuery.trim() || filteredAddresses.length > 0) && (
            <div className="space-y-1 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-2">Saved Addresses</h3>
              {filteredAddresses.map((address, idx) => {
                const isActive = activeAddress === address;
                return (
                  <div 
                    key={idx} 
                    onClick={() => {
                      onSelectAddress(address);
                      onClose();
                    }}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl hover:bg-white/5 border transition-all cursor-pointer group ${
                      isActive ? 'bg-white/5 border-white/10' : 'border-transparent hover:border-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className={`w-5 h-5 shrink-0 mt-0.5 transition-colors ${isActive ? 'text-accent' : 'text-muted-foreground group-hover:text-accent'}`} />
                      <p className={`text-sm leading-relaxed font-medium ${isActive ? 'text-white font-bold' : 'text-foreground/90'}`}>
                        {address}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); /* edit logic */ }}
                        className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); /* delete logic */ }}
                        className="p-2 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </Card>
    </div>
  );
}
