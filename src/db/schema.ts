import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex
} from "drizzle-orm/pg-core";

export const rooms = pgTable("rooms", {
  code: text("code").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull().defaultNow()
});

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull(),
    description: text("description").notNull(),
    useCase: text("use_case").notNull(),
    imagePath: text("image_path").notNull(),
    specs: jsonb("specs").$type<string[]>().notNull(),
    tags: jsonb("tags").$type<string[]>().notNull(),
    listPriceCents: integer("list_price_cents").notNull(),
    excellentPriceCents: integer("excellent_price_cents").notNull(),
    goodPriceCents: integer("good_price_cents").notNull(),
    defaultNewStock: integer("default_new_stock").notNull(),
    defaultExcellentStock: integer("default_excellent_stock").notNull(),
    defaultGoodStock: integer("default_good_stock").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("products_slug_unique").on(table.slug)]
);

export const pricingPolicies = pgTable(
  "pricing_policies",
  {
    roomCode: text("room_code")
      .notNull()
      .references(() => rooms.code, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    floorPriceCents: integer("floor_price_cents").notNull(),
    maxInstantDiscountBps: integer("max_instant_discount_bps").notNull(),
    tierOneCount: integer("tier_one_count").notNull().default(5),
    tierOneDiscountBps: integer("tier_one_discount_bps").notNull().default(800),
    tierTwoCount: integer("tier_two_count").notNull().default(10),
    tierTwoDiscountBps: integer("tier_two_discount_bps").notNull().default(1200),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [primaryKey({ columns: [table.roomCode, table.productId] })]
);

export const roomInventory = pgTable(
  "room_inventory",
  {
    roomCode: text("room_code")
      .notNull()
      .references(() => rooms.code, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    newStock: integer("new_stock").notNull(),
    excellentStock: integer("excellent_stock").notNull(),
    goodStock: integer("good_stock").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [primaryKey({ columns: [table.roomCode, table.productId] })]
);

export const groupCommitments = pgTable(
  "group_commitments",
  {
    id: text("id").primaryKey(),
    roomCode: text("room_code")
      .notNull()
      .references(() => rooms.code, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    participantKey: text("participant_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("group_participant_unique").on(table.roomCode, table.productId, table.participantKey),
    index("group_room_product_idx").on(table.roomCode, table.productId)
  ]
);

export const offers = pgTable(
  "offers",
  {
    id: text("id").primaryKey(),
    roomCode: text("room_code")
      .notNull()
      .references(() => rooms.code, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    condition: text("condition").notNull(),
    targetPriceCents: integer("target_price_cents").notNull(),
    offeredPriceCents: integer("offered_price_cents").notNull(),
    priceSource: text("price_source").notNull(),
    sourceBargainId: text("source_bargain_id"),
    status: text("status").notNull(),
    rationale: text("rationale").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull()
  },
  (table) => [index("offers_room_created_idx").on(table.roomCode, table.createdAt)]
);

export const bargains = pgTable(
  "bargains",
  {
    id: text("id").primaryKey(),
    roomCode: text("room_code")
      .notNull()
      .references(() => rooms.code, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    condition: text("condition").notNull(),
    priceCents: integer("price_cents").notNull(),
    inventory: integer("inventory").notNull(),
    message: text("message").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull()
  },
  (table) => [index("bargains_room_active_idx").on(table.roomCode, table.status, table.expiresAt)]
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    roomCode: text("room_code")
      .notNull()
      .references(() => rooms.code, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    subscriberKey: text("subscriber_key").notNull(),
    condition: text("condition").notNull(),
    targetPriceCents: integer("target_price_cents").notNull(),
    active: integer("active").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("subscription_preference_unique").on(
      table.roomCode,
      table.productId,
      table.subscriberKey,
      table.condition
    )
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    roomCode: text("room_code")
      .notNull()
      .references(() => rooms.code, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    bargainId: text("bargain_id")
      .notNull()
      .references(() => bargains.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("notification_match_unique").on(table.subscriptionId, table.bargainId),
    index("notifications_room_created_idx").on(table.roomCode, table.createdAt)
  ]
);

export const mockOrders = pgTable(
  "mock_orders",
  {
    id: text("id").primaryKey(),
    roomCode: text("room_code")
      .notNull()
      .references(() => rooms.code, { onDelete: "cascade" }),
    offerId: text("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    condition: text("condition").notNull(),
    priceCents: integer("price_cents").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("mock_order_offer_unique").on(table.offerId)]
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: serial("id").primaryKey(),
    roomCode: text("room_code")
      .notNull()
      .references(() => rooms.code, { onDelete: "cascade" }),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("audit_room_created_idx").on(table.roomCode, table.createdAt)]
);

export const eventOutbox = pgTable(
  "event_outbox",
  {
    id: serial("id").primaryKey(),
    roomCode: text("room_code")
      .notNull()
      .references(() => rooms.code, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("outbox_room_id_idx").on(table.roomCode, table.id)]
);

export type ProductRow = typeof products.$inferSelect;
export type PolicyRow = typeof pricingPolicies.$inferSelect;
export type BargainRow = typeof bargains.$inferSelect;
export type OfferRow = typeof offers.$inferSelect;

