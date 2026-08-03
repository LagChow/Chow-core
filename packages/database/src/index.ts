import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, verificationTokens, savedVendors, vendors, categories, items, deliveryModes, orders, orderItems, admins, riders, platformSettings, broadcasts, pushSubscriptions } from './schema';

const schema = { users, verificationTokens, savedVendors, vendors, categories, items, deliveryModes, orders, orderItems, admins, riders, platformSettings, broadcasts, pushSubscriptions };

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

export * from './schema';
export { eq, and, desc, inArray } from 'drizzle-orm';
