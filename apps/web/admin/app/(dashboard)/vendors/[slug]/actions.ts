"use server";

import { db } from '@lagchow/database';
import { vendors } from '@lagchow/database/src/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateVendorCoverImage(vendorId: string, coverImageUrl: string, vendorSlug: string) {
  try {
    await db.update(vendors)
      .set({ coverImage: coverImageUrl })
      .where(eq(vendors.id, vendorId));
      
    // Revalidate the specific vendor's page
    revalidatePath(`/vendors/${vendorSlug}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update cover image:", error);
    return { success: false, error: "Database error" };
  }
}
