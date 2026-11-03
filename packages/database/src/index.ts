import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/lagchow';

const sql = neon(connectionString);

const createDb = () => drizzle(sql, { schema });

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDb> | undefined;
};

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

export * from './schema';
export { eq, and, desc, inArray } from 'drizzle-orm';
