"use client";

import React, { useState } from 'react';
import { UploadButton } from '@/lib/uploadthing';
import { updateVendorCoverImage } from '../../app/(dashboard)/vendors/[slug]/actions';
import { Button } from '@/components/ui/button';
import { Loader2, Camera } from 'lucide-react';

interface CoverImageUploadProps {
  vendorId: string;
  vendorSlug: string;
}

export function CoverImageUpload({ vendorId, vendorSlug }: CoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="relative">
      <div className={isUploading ? "opacity-50 pointer-events-none" : ""}>
        <UploadButton
          endpoint="imageUploader"
          onUploadBegin={() => {
            setIsUploading(true);
          }}
          onClientUploadComplete={async (res) => {
            if (res && res[0]) {
              await updateVendorCoverImage(vendorId, res[0].url, vendorSlug);
            }
            setIsUploading(false);
          }}
          onUploadError={(error: Error) => {
            console.error(error);
            setIsUploading(false);
            alert(`ERROR! ${error.message}`);
          }}
          appearance={{
            button: "bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold backdrop-blur-md transition-colors text-sm h-10 after:hidden ut-uploading:bg-white/20",
            allowedContent: "hidden",
          }}
          content={{
            button({ ready, isUploading }) {
              if (!ready) return <Loader2 className="w-4 h-4 animate-spin" />;
              if (isUploading) return <Loader2 className="w-4 h-4 animate-spin" />;
              return (
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span>Edit Cover</span>
                </div>
              );
            }
          }}
        />
      </div>
    </div>
  );
}
