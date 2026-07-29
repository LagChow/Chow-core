import React from 'react';
import { db } from '@lagchow/database';
import { platformSettings } from '@lagchow/database/src/schema';
import { SettingsClient } from './client';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  // Fetch all current platform settings
  const settingsRecords = await db.select().from(platformSettings);
  
  // Convert array of key/value rows into a simple object for the client
  const initialSettings = settingsRecords.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, any>);

  return (
    <SettingsClient initialSettings={initialSettings} />
  );
}
