'use server';

import { db } from '@lagchow/database';
import { platformSettings, broadcasts, riders } from '@lagchow/database/src/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Helper to upsert settings since Drizzle Postgres doesn't natively support ON CONFLICT well without raw SQL in this setup
async function setSetting(key: string, value: any) {
  const existingRecords = await db.select().from(platformSettings).where(eq(platformSettings.key, key)).limit(1);
  const existing = existingRecords[0];

  if (existing) {
    await db.update(platformSettings).set({ value, updatedAt: new Date() }).where(eq(platformSettings.key, key));
  } else {
    await db.insert(platformSettings).values({ key, value });
  }
}

export async function toggleMaintenanceMode(isEnabled: boolean) {
  await setSetting('maintenance_mode', isEnabled);
  revalidatePath('/settings');
}

export async function togglePauseOrders(isEnabled: boolean) {
  await setSetting('pause_orders', isEnabled);
  revalidatePath('/settings');
}

export async function forceOfflineRiders() {
  await db.update(riders).set({ status: 'offline', updatedAt: new Date() });
  revalidatePath('/settings');
  revalidatePath('/active-riders'); // revalidate the riders page too
}

export async function saveSupportContacts(customerSupport: string, vendorSupport: string) {
  await setSetting('support_contacts', { customerSupport, vendorSupport });
  revalidatePath('/settings');
}

export async function sendGlobalBroadcast(title: string, message: string) {
  await db.insert(broadcasts).values({
    title,
    message,
    targetAudience: 'all',
    status: 'sent'
  });
  
  // Here is where you would trigger Firebase / OneSignal / Resend
  console.log(`[BROADCAST SENT] ${title}: ${message}`);

  revalidatePath('/settings');
}
