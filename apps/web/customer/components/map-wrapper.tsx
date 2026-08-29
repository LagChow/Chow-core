"use client";

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

// Dynamically import the map component with SSR disabled
const UnilagMap = dynamic(() => import('./unilag-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-card text-muted-foreground gap-4">
      <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="font-semibold text-sm">Loading Map...</p>
    </div>
  ),
});

export function MapWrapper() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vendors')
      .then(res => res.json())
      .then(data => {
        if (data.vendors) {
          setVendors(data.vendors.slice(0, 8)); // Just show a few for the landing page
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full h-[600px] flex flex-col md:flex-row bg-white rounded-3xl border-4 border-black overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)] z-0">
      
      {/* MAP COLUMN */}
      <div className="w-full md:w-2/3 h-[300px] md:h-full relative border-b-4 md:border-b-0 md:border-r-4 border-black">
        <UnilagMap />
      </div>

      {/* RESTAURANTS SIDEBAR COLUMN */}
      <div className="w-full md:w-1/3 flex-1 flex flex-col bg-white min-h-[300px]">
        
        {/* HEADER */}
        <div className="bg-[#93c5fd] border-b-4 border-black p-4 flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-4 border-orange-500 bg-white shadow-sm shrink-0"></div>
          <h2 className="text-xl font-black text-black tracking-tight">Restaurants</h2>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center p-4 text-black/60 font-semibold text-sm">No restaurants available right now.</div>
          ) : (
            vendors.map((vendor, idx) => (
              <Link key={vendor.id || idx} href={`/store/${vendor.id}`}>
                <div className="bg-white border-2 border-black/10 rounded-xl p-4 flex items-center justify-between hover:border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-black/10 relative">
                      <Image src={vendor.coverImage} alt={vendor.name} fill sizes="40px" className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-black text-sm leading-tight group-hover:text-accent transition-colors">{vendor.name}</h4>
                      <p className="text-black/50 text-xs font-semibold mt-1 flex items-center gap-1">
                        ★ {vendor.rating} • {vendor.deliveryTime}
                      </p>
                    </div>
                  </div>
                  <button className="text-green-500 border-2 border-transparent hover:border-green-500 p-2 rounded-lg transition-colors group-hover:bg-green-50">
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
