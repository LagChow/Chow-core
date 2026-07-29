import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`TRUNCATE TABLE vendors CASCADE;`;
  console.log("Truncated vendors table");
}

main().catch(console.error);
