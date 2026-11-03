import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const DEFAULT_URL = 'postgresql://placeholder:placeholder@localhost:5432/lagchow';

function getSanitizedConnectionString(): string {
  let raw = process.env.DATABASE_URL;
  if (!raw || typeof raw !== 'string') {
    return DEFAULT_URL;
  }

  // Strip leading/trailing whitespace and enclosing quotes (single, double, or backticks)
  raw = raw.trim();
  while (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'")) ||
    (raw.startsWith('`') && raw.endsWith('`'))
  ) {
    raw = raw.slice(1, -1).trim();
  }

  // Unescape backslash-escaped quotes if present
  if (raw.startsWith('\\"') && raw.endsWith('\\"')) {
    raw = raw.slice(2, -2).trim();
  }

  // Check if valid URL according to standard
  try {
    new URL(raw);
    return raw;
  } catch {
    console.warn(
      '[database] Provided DATABASE_URL is not a valid URL. Using build-safe fallback.'
    );
    return DEFAULT_URL;
  }
}

type DbInstance = NeonHttpDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  db: DbInstance | undefined;
};

function createDb(): DbInstance {
  const connectionString = getSanitizedConnectionString();
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

function getDb(): DbInstance {
  if (!globalForDb.db) {
    globalForDb.db = createDb();
  }
  return globalForDb.db;
}

export const db: DbInstance = new Proxy({} as DbInstance, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

export * from './schema';
export { eq, and, desc, inArray } from 'drizzle-orm';
