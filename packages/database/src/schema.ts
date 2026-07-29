import { pgTable, text, timestamp, boolean, uuid, integer, jsonb, doublePrecision, index } from 'drizzle-orm/pg-core';

export const deliveryModes = pgTable('delivery_modes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(), // e.g. "Walker", "Bicycle", "Campus Connect", "Campus Express"
  maxDistanceKm: doublePrecision('max_distance_km').notNull(), // Land proximity threshold
  baseFee: integer('base_fee').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  isStudent: boolean('is_student').default(true),
  hallOfResidence: text('hall_of_residence'),
  landmark: text('landmark'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(), // usually email
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
});

export const savedVendors = pgTable('saved_vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  vendorId: text('vendor_id').notNull(), // The string ID from lib/data.ts
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const vendors = pgTable('vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(), // e.g., 'olaiya-foods'
  name: text('name').notNull(),
  email: text('email').unique(), // For OTP login
  phone: text('phone'),
  coverImage: text('cover_image').notNull(),
  rating: text('rating').notNull(), // can be stored as string or numeric
  reviews: text('reviews').notNull(),
  deliveryTime: text('delivery_time').notNull(),
  preparationTime: integer('preparation_time').default(15),
  distance: text('distance').notNull(),
  deliveryFee: text('delivery_fee').notNull(),
  minOrder: text('min_order').notNull(),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  tags: jsonb('tags').notNull().default('[]'),
  queueStatus: jsonb('queue_status').notNull().default('{}'),
  bankAccount: jsonb('bank_account'),
  status: text('status').default('pending_first_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index('vendor_created_at_idx').on(table.createdAt),
  statusIdx: index('vendor_status_idx').on(table.status),
}));

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  image: text('image'),
  popular: boolean('popular').default(false),
  isAvailable: boolean('is_available').default(true),
  
  // Advanced Menu Management Fields
  preparationTime: integer('preparation_time'), // e.g. 15
  peakPreparationTime: integer('peak_preparation_time'), // e.g. 25
  mealType: text('meal_type').default('single'), // 'single' | 'combo'
  comboIncludes: jsonb('combo_includes').default('[]'), // array of strings/items
  portionSize: text('portion_size'), // 'small' | 'regular' | 'large'
  dailyQuantity: integer('daily_quantity'), // null = unlimited
  tags: jsonb('tags').default('[]'), // ['Best Seller', 'Spicy', etc.]
  visibility: text('visibility').default('published'), // 'published' | 'draft'

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const riders = pgTable('riders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id), // If they are also app users
  name: text('name').notNull(),
  email: text('email').unique(),
  phone: text('phone').notNull(),
  vehicleType: text('vehicle_type').notNull().default('walker'), // walker, bicycle, shuttle
  status: text('status').notNull().default('pending'), // active, offline, suspended, pending
  currentLat: doublePrecision('current_lat'),
  currentLng: doublePrecision('current_lng'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  deliveryModeId: uuid('delivery_mode_id').references(() => deliveryModes.id),
  riderId: uuid('rider_id').references(() => riders.id),
  status: text('status').notNull().default('pending'), // pending, accepted, preparing, out_for_delivery, delivered, cancelled
  totalAmount: integer('total_amount').notNull(),
  deliveryFee: integer('delivery_fee').notNull().default(0),
  convenienceFee: integer('convenience_fee').notNull().default(0),
  deliveryAddress: jsonb('delivery_address').notNull(), // e.g. { hall: 'New Hall', room: '123' }
  notes: text('notes'),
  estimatedReadyTime: timestamp('estimated_ready_time'),
  paymentMethod: text('payment_method').notNull().default('transfer'), // wallet, online, transfer
  paymentStatus: text('payment_status').notNull().default('pending'), // pending, paid, failed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index('order_created_at_idx').on(table.createdAt),
  statusIdx: index('order_status_idx').on(table.status),
  vendorIdIdx: index('order_vendor_id_idx').on(table.vendorId),
}));

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => items.id),
  quantity: integer('quantity').notNull(),
  priceAtTime: integer('price_at_time').notNull(),
});

export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('admin'), // 'super_admin' or 'admin'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const platformSettings = pgTable('platform_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(), // e.g. 'maintenance_mode', 'pause_orders', 'support_contacts'
  value: jsonb('value').notNull(), // JSON value for flexibility
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const broadcasts = pgTable('broadcasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  targetAudience: text('target_audience').default('all'), // 'all', 'customers', 'vendors', 'riders'
  status: text('status').default('sent'), // 'sent', 'pending'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
