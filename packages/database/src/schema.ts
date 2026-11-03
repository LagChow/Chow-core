import { pgTable, text, timestamp, boolean, uuid, integer, jsonb, doublePrecision, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
  restockTime: timestamp('restock_time'), // Timestamp for when the item will be available again

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ---------- DELIVERY ENGINE TABLES ----------

// Landmarks: pre-mapped campus checkpoints for geofence-based progress notifications
export const landmarks = pgTable('landmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),                           // e.g. 'New Hall Gate'
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  radiusMeters: integer('radius_meters').default(30),     // Recommended 25–40m (GPS jitter margin)
  routeTags: jsonb('route_tags').default('[]'),           // e.g. ['main-gate-to-mth', 'moremi-route']
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Batch Groups: groups multiple orders from the same building/hostel for P2P delivery splitting
export const batchGroups = pgTable('batch_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  hostelKey: text('hostel_key').notNull(),                // e.g. 'MTH' — must match users.hallOfResidence
  riderId: uuid('rider_id'),                              // assigned after dispatch
  status: text('status').default('open'),                 // 'open' | 'dispatched' | 'delivered'
  batchWindowClosesAt: timestamp('batch_window_closes_at').notNull(), // e.g. now() + 5 mins
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const riders = pgTable('riders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),     // If they are also app users
  name: text('name').notNull(),
  email: text('email').unique(),
  phone: text('phone').notNull(),
  vehicleType: text('vehicle_type').notNull().default('walker'), // walker, bicycle, shuttle
  status: text('status').notNull().default('pending'),    // online, offline, suspended, pending

  // Delivery Engine: capacity tracking (atomic update: current_order_count < 2)
  currentOrderCount: integer('current_order_count').notNull().default(0), // max 2 concurrent orders

  // GPS tracking for dispatch matching and checkpoint engine
  currentLat: doublePrecision('current_lat'),
  currentLng: doublePrecision('current_lng'),
  lastLocationAt: timestamp('last_location_at'),          // when GPS was last updated

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('rider_status_idx').on(table.status),
  orderCountIdx: index('rider_order_count_idx').on(table.currentOrderCount),
}));

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  deliveryModeId: uuid('delivery_mode_id').references(() => deliveryModes.id),
  riderId: uuid('rider_id').references(() => riders.id),
  status: text('status').notNull().default('pending'), // pending, accepted, preparing, ready, rider_accepted, rider_at_vendor, out_for_delivery, arrived, delivered, cancelled
  statusTimestamps: jsonb('status_timestamps').default('{}'), // Tracks when each status was triggered: { "accepted": "2024-01-01T12:00:00Z", "preparing": ... }
  totalAmount: integer('total_amount').notNull(),
  deliveryFee: integer('delivery_fee').notNull().default(0),
  convenienceFee: integer('convenience_fee').notNull().default(0),
  deliveryAddress: jsonb('delivery_address').notNull(), // e.g. { hall: 'New Hall', room: '123' }
  deliveryLat: doublePrecision('delivery_lat'),
  deliveryLng: doublePrecision('delivery_lng'),
  notes: text('notes'),
  estimatedReadyTime: timestamp('estimated_ready_time'),
  paymentMethod: text('payment_method').notNull().default('transfer'), // wallet, online, transfer
  paymentStatus: text('payment_status').notNull().default('pending'), // pending, paid, failed
  paymentReference: text('payment_reference'),
  transactionReference: text('transaction_reference'),

  // Delivery Engine: ETA & dispatch tracking
  estimatedArrivalTime: timestamp('estimated_arrival_time'),  // ORS-computed ETA, refreshed periodically
  dispatchedAt: timestamp('dispatched_at'),                   // when rider was assigned
  candidateRiderId: uuid('candidate_rider_id').references(() => riders.id), // reserved rider during dispatch

  // Delivery Engine: Checkpoint (geofence progress notifications)
  landmarksNotified: jsonb('landmarks_notified').default('[]'), // ["landmark-uuid-1", ...] — debounce guard

  // Delivery Engine: P2P Batching
  batchGroupId: uuid('batch_group_id'),                       // FK to batch_groups if part of a batch
  isBatched: boolean('is_batched').default(false),
  splitDeliveryFee: integer('split_delivery_fee'),            // what this specific order actually paid (post-split)

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index('order_created_at_idx').on(table.createdAt),
  statusIdx: index('order_status_idx').on(table.status),
  vendorIdIdx: index('order_vendor_id_idx').on(table.vendorId),
  riderIdIdx: index('order_rider_id_idx').on(table.riderId),
  batchGroupIdx: index('order_batch_group_idx').on(table.batchGroupId),
  paymentRefIdx: index('order_payment_ref_idx').on(table.paymentReference),
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

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'cascade' }),
  riderId: uuid('rider_id').references(() => riders.id, { onDelete: 'cascade' }),
  adminId: uuid('admin_id').references(() => admins.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  provider: text('provider').notNull().default('monnify'),
  payload: jsonb('payload').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'processed' | 'failed'
  error: text('error'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index('webhook_event_id_idx').on(table.eventId),
  statusIdx: index('webhook_status_idx').on(table.status),
}));

// ---------- DRIZZLE RELATIONS ----------

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  savedVendors: many(savedVendors),
}));

export const savedVendorsRelations = relations(savedVendors, ({ one }) => ({
  user: one(users, {
    fields: [savedVendors.userId],
    references: [users.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  categories: many(categories),
  orders: many(orders),
  batchGroups: many(batchGroups),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [categories.vendorId],
    references: [vendors.id],
  }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const ridersRelations = relations(riders, ({ one, many }) => ({
  user: one(users, {
    fields: [riders.userId],
    references: [users.id],
  }),
  orders: many(orders, { relationName: 'riderOrders' }),
  candidateOrders: many(orders, { relationName: 'candidateRiderOrders' }),
}));

export const batchGroupsRelations = relations(batchGroups, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [batchGroups.vendorId],
    references: [vendors.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  vendor: one(vendors, {
    fields: [orders.vendorId],
    references: [vendors.id],
  }),
  deliveryMode: one(deliveryModes, {
    fields: [orders.deliveryModeId],
    references: [deliveryModes.id],
  }),
  rider: one(riders, {
    fields: [orders.riderId],
    references: [riders.id],
    relationName: 'riderOrders',
  }),
  candidateRider: one(riders, {
    fields: [orders.candidateRiderId],
    references: [riders.id],
    relationName: 'candidateRiderOrders',
  }),
  batchGroup: one(batchGroups, {
    fields: [orders.batchGroupId],
    references: [batchGroups.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  item: one(items, {
    fields: [orderItems.itemId],
    references: [items.id],
  }),
}));
