import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { SocketProvider } from "@lagchow/realtime";

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
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <head>
        <title>LagChow Vendor Dashboard</title>
        <meta name="description" content="Manage your menu, orders, and earnings on LagChow." />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-accent selection:text-black">
        {isMaintenanceMode ? (
          <MaintenanceScreen />
        ) : (
          <SocketProvider token={token}>
            <>{children}</>
          </SocketProvider>
        )}
      </body>
    </html>
  );
}
