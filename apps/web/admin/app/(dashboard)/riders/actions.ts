'use server';

import { db } from '@lagchow/database';
import { riders } from '@lagchow/database/src/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export async function onboardRider(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const vehicleType = formData.get('vehicleType') as string;

  if (!name || !email || !phone || !vehicleType) {
    return { error: 'All fields are required.' };
  }

  try {
    // Check if email already exists
    const existing = await db.query.riders.findFirst({
      where: eq(riders.email, email)
    });

    if (existing) {
      return { error: 'A rider with this email already exists.' };
    }

    await db.insert(riders).values({
      name,
      email,
      phone,
      vehicleType,
      status: 'pending'
    });

    revalidatePath('/riders');
    return { success: true };
  } catch (error: any) {
    console.error('Error onboarding rider:', error);
    return { error: error.message || 'Failed to onboard rider. Please try again.' };
  }
}
