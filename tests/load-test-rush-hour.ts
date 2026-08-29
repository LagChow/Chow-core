import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { SignJWT } from 'jose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load the environment variables from the customer app to access the database
dotenv.config({ path: path.join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in .env");
}

const sql = neon(DATABASE_URL);

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_for_development_only_123'
);

async function signToken(payload: any, expiresIn = '7d') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

// Test Data IDs
const TEST_USER_ID = crypto.randomUUID();
const TEST_USER_EMAIL = 'load-test-user@chowvest.com';

const TEST_VENDOR_ID = crypto.randomUUID();
const TEST_VENDOR_SLUG = 'load-test-vendor';

const TEST_CATEGORY_ID = crypto.randomUUID();
const TEST_ITEM_ID = crypto.randomUUID();

const TARGET_ORDERS = 350;
const DURATION_SECONDS = 30; // Ramp up over 30 seconds

async function setup() {
  console.log("🛠️ Setting up test data in the database...");
  
  // 1. Insert Test User
  await sql`
    INSERT INTO users (id, email, name, is_verified)
    VALUES (${TEST_USER_ID}, ${TEST_USER_EMAIL}, 'Load Test User', true)
    ON CONFLICT (email) DO NOTHING
  `;

  // 2. Insert Test Vendor
  await sql`
    INSERT INTO vendors (id, slug, name, cover_image, rating, reviews, delivery_time, distance, delivery_fee, min_order, status)
    VALUES (
      ${TEST_VENDOR_ID}, 
      ${TEST_VENDOR_SLUG}, 
      'Load Test Vendor', 
      'https://via.placeholder.com/150', 
      '5.0', 
      '(100)', 
      '15-20 mins', 
      '1km', 
      '500', 
      '1000',
      'active'
    )
    ON CONFLICT (slug) DO NOTHING
  `;

  // 3. Insert Test Category
  await sql`
    INSERT INTO categories (id, vendor_id, name)
    VALUES (${TEST_CATEGORY_ID}, ${TEST_VENDOR_ID}, 'Test Category')
    ON CONFLICT DO NOTHING
  `;

  // 4. Insert Test Item
  await sql`
    INSERT INTO items (id, category_id, name, price, is_available)
    VALUES (${TEST_ITEM_ID}, ${TEST_CATEGORY_ID}, 'Test Spicy Rice', 2000, true)
    ON CONFLICT DO NOTHING
  `;

  console.log("✅ Setup complete.");
}

async function teardown() {
  console.log("🧹 Tearing down test data...");
  // Cascade deletes will handle order_items when orders are deleted, 
  // and categories/items when vendor is deleted.
  
  // Let's manually delete the orders for this user first
  await sql`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ${TEST_USER_ID})`;
  await sql`DELETE FROM orders WHERE user_id = ${TEST_USER_ID}`;
  
  // Delete Vendor (this cascades to categories and items)
  await sql`DELETE FROM vendors WHERE id = ${TEST_VENDOR_ID}`;
  
  // Delete User (this cascades to saved_vendors, etc.)
  await sql`DELETE FROM users WHERE id = ${TEST_USER_ID}`;
  
  console.log("✅ Teardown complete.");
}

async function simulateRushHour() {
  console.log(`🚀 Starting Rush Hour Simulation: Target ${TARGET_ORDERS} orders over ~${DURATION_SECONDS} seconds...`);
  
  const token = await signToken({ email: TEST_USER_EMAIL, id: TEST_USER_ID });
  const API_URL = "http://localhost:3000/api/orders";

  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `__session=${token}`
  };

  const payload = {
    vendorId: TEST_VENDOR_SLUG,
    deliveryModeId: null,
    totalAmount: 2000, // 1 quantity of 2000 price
    deliveryFee: 500,
    convenienceFee: 100,
    deliveryAddress: { hall: 'Test Hall', room: '123' },
    notes: 'Load test order',
    paymentMethod: 'transfer',
    items: [
      {
        id: TEST_ITEM_ID,
        quantity: 1,
        price: 2000
      }
    ]
  };

  let successCount = 0;
  let failCount = 0;
  let latencies: number[] = [];

  const startTime = Date.now();
  
  const promises = Array.from({ length: TARGET_ORDERS }).map(async (_, index) => {
    // Distribute the start time of the requests over the DURATION_SECONDS to simulate ramp-up
    const delayMs = Math.random() * (DURATION_SECONDS * 1000);
    await new Promise(res => setTimeout(res, delayMs));

    const reqStart = Date.now();
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        successCount++;
      } else {
        failCount++;
        const errText = await response.text();
        console.error(`Request failed with status ${response.status}: ${errText}`);
      }
    } catch (e: any) {
      failCount++;
      console.error(`Request threw an error: ${e.message}`);
    } finally {
      latencies.push(Date.now() - reqStart);
    }
  });

  await Promise.all(promises);

  const totalTime = (Date.now() - startTime) / 1000;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const maxLatency = Math.max(...latencies);

  console.log("📊 === Simulation Results ===");
  console.log(`Total Time: ${totalTime.toFixed(2)} seconds`);
  console.log(`Successful Orders: ${successCount}`);
  console.log(`Failed Orders: ${failCount}`);
  console.log(`Average Latency: ${avgLatency.toFixed(2)} ms`);
  console.log(`Max Latency: ${maxLatency.toFixed(2)} ms`);
  console.log(`Avg RPS: ${(TARGET_ORDERS / totalTime).toFixed(2)} requests/second`);
}

async function run() {
  try {
    await setup();
    await simulateRushHour();
  } catch (error) {
    console.error("❌ Test encountered an error:", error);
  } finally {
    await teardown();
    process.exit(0);
  }
}

run();
