import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, verificationTokens, savedVendors, vendors, categories, items, deliveryModes, orders, orderItems, admins, riders, platformSettings, broadcasts, pushSubscriptions } from './schema';

const schema = { users, verificationTokens, savedVendors, vendors, categories, items, deliveryModes, orders, orderItems, admins, riders, platformSettings, broadcasts, pushSubscriptions };

const sql = neon(process.env.DATABASE_URL!);

const createDb = () => drizzle(sql, { schema });

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDb> | undefined;
};

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

export * from './schema';
export { eq, and, desc, inArray } from 'drizzle-orm';
