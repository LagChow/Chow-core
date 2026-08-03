import './globals.css';
import React from 'react';
import { CartProvider } from '@/lib/cart-context';
import { CartDrawer } from '@/components/cart-drawer';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { SocketProvider } from "@lagchow/realtime";
import { Toaster } from "@/components/ui/sonner";

import { MaintenanceScreen } from '@/components/maintenance-screen';
import { db } from '@lagchow/database';
import { platformSettings } from '@lagchow/database/src/schema';
import { eq } from 'drizzle-orm';
import { cookies } from "next/headers";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if maintenance mode is enabled
  const maintenanceRecord = await db.select().from(platformSettings).where(eq(platformSettings.key, 'maintenance_mode')).limit(1);
  const isMaintenanceMode = maintenanceRecord[0]?.value === true;

  const cookieStore = await cookies();
  const token = cookieStore.get('__session')?.value;

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <title>LagChow — Order Food</title>
        <meta name="description" content="Order from your favorite campus vendors on LagChow." />
      </head>
      <body className="bg-background min-h-screen font-sans antialiased text-foreground selection:bg-accent selection:text-black">
        {isMaintenanceMode ? (
          <MaintenanceScreen />
        ) : (
          <SocketProvider token={token}>
            <CartProvider>
              <>{children}</>
              <CartDrawer />
            </CartProvider>
          </SocketProvider>
        )}
        <Toaster />
      </body>
    </html>
  );
}
