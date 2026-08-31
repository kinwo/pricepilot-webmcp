CREATE TABLE "audit_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bargains" (
	"id" text PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"product_id" text NOT NULL,
	"condition" text NOT NULL,
	"price_cents" integer NOT NULL,
	"inventory" integer NOT NULL,
	"message" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_outbox" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_commitments" (
	"id" text PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"product_id" text NOT NULL,
	"participant_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"offer_id" text NOT NULL,
	"product_id" text NOT NULL,
	"condition" text NOT NULL,
	"price_cents" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"subscription_id" text NOT NULL,
	"bargain_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" text PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"product_id" text NOT NULL,
	"condition" text NOT NULL,
	"target_price_cents" integer NOT NULL,
	"offered_price_cents" integer NOT NULL,
	"price_source" text NOT NULL,
	"source_bargain_id" text,
	"status" text NOT NULL,
	"rationale" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_policies" (
	"room_code" text NOT NULL,
	"product_id" text NOT NULL,
	"floor_price_cents" integer NOT NULL,
	"max_instant_discount_bps" integer NOT NULL,
	"tier_one_count" integer DEFAULT 5 NOT NULL,
	"tier_one_discount_bps" integer DEFAULT 800 NOT NULL,
	"tier_two_count" integer DEFAULT 10 NOT NULL,
	"tier_two_discount_bps" integer DEFAULT 1200 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_policies_room_code_product_id_pk" PRIMARY KEY("room_code","product_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"description" text NOT NULL,
	"use_case" text NOT NULL,
	"image_path" text NOT NULL,
	"specs" jsonb NOT NULL,
	"tags" jsonb NOT NULL,
	"list_price_cents" integer NOT NULL,
	"excellent_price_cents" integer NOT NULL,
	"good_price_cents" integer NOT NULL,
	"default_new_stock" integer NOT NULL,
	"default_excellent_stock" integer NOT NULL,
	"default_good_stock" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_inventory" (
	"room_code" text NOT NULL,
	"product_id" text NOT NULL,
	"new_stock" integer NOT NULL,
	"excellent_stock" integer NOT NULL,
	"good_stock" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_inventory_room_code_product_id_pk" PRIMARY KEY("room_code","product_id")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"code" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reset_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"product_id" text NOT NULL,
	"subscriber_key" text NOT NULL,
	"condition" text NOT NULL,
	"target_price_cents" integer NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_room_code_rooms_code_fk" FOREIGN KEY ("room_code") REFERENCES "public"."rooms"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bargains" ADD CONSTRAINT "bargains_room_code_rooms_code_fk" FOREIGN KEY ("room_code") REFERENCES "public"."rooms"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bargains" ADD CONSTRAINT "bargains_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_outbox" ADD CONSTRAINT "event_outbox_room_code_rooms_code_fk" FOREIGN KEY ("room_code") REFERENCES "public"."rooms"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_commitments" ADD CONSTRAINT "group_commitments_room_code_rooms_code_fk" FOREIGN KEY ("room_code") REFERENCES "public"."rooms"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_commitments" ADD CONSTRAINT "group_commitments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_orders" ADD CONSTRAINT "mock_orders_room_code_rooms_code_fk" FOREIGN KEY ("room_code") REFERENCES "public"."rooms"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_orders" ADD CONSTRAINT "mock_orders_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_orders" ADD CONSTRAINT "mock_orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_room_code_rooms_code_fk" FOREIGN KEY ("room_code") REFERENCES "public"."rooms"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_bargain_id_bargains_id_fk" FOREIGN KEY ("bargain_id") REFERENCES "public"."bargains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_room_code_rooms_code_fk" FOREIGN KEY ("room_code") REFERENCES "public"."rooms"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_policies" ADD CONSTRAINT "pricing_policies_room_code_rooms_code_fk" FOREIGN KEY ("room_code") REFERENCES "public"."rooms"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_policies" ADD CONSTRAINT "pricing_policies_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_inventory" ADD CONSTRAINT "room_inventory_room_code_rooms_code_fk" FOREIGN KEY ("room_code") REFERENCES "public"."rooms"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_inventory" ADD CONSTRAINT "room_inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_room_code_rooms_code_fk" FOREIGN KEY ("room_code") REFERENCES "public"."rooms"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_room_created_idx" ON "audit_events" USING btree ("room_code","created_at");--> statement-breakpoint
CREATE INDEX "bargains_room_active_idx" ON "bargains" USING btree ("room_code","status","expires_at");--> statement-breakpoint
CREATE INDEX "outbox_room_id_idx" ON "event_outbox" USING btree ("room_code","id");--> statement-breakpoint
CREATE UNIQUE INDEX "group_participant_unique" ON "group_commitments" USING btree ("room_code","product_id","participant_key");--> statement-breakpoint
CREATE INDEX "group_room_product_idx" ON "group_commitments" USING btree ("room_code","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mock_order_offer_unique" ON "mock_orders" USING btree ("offer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_match_unique" ON "notifications" USING btree ("subscription_id","bargain_id");--> statement-breakpoint
CREATE INDEX "notifications_room_created_idx" ON "notifications" USING btree ("room_code","created_at");--> statement-breakpoint
CREATE INDEX "offers_room_created_idx" ON "offers" USING btree ("room_code","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_unique" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_preference_unique" ON "subscriptions" USING btree ("room_code","product_id","subscriber_key","condition");