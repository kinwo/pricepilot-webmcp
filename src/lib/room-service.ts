import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gt, gte, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { CATALOG, SHOWCASE_PRODUCT_ID } from "@/db/demo-data";
import {
  auditEvents,
  bargains,
  eventOutbox,
  groupCommitments,
  mockOrders,
  notifications,
  offers,
  pricingPolicies,
  products,
  roomInventory,
  rooms,
  subscriptions,
  type BargainRow,
  type PolicyRow,
  type ProductRow
} from "@/db/schema";
import {
  actionInputSchemas,
  merchantActions,
  roomCodeSchema,
  shopperActions,
  type ActionName,
  type Role,
  type ToolResult
} from "./contracts";
import { emitRoomEvent, type RoomEvent } from "./events";
import {
  buildPriceOptions,
  discountedPrice,
  getGroupTier,
  negotiatePrice,
  type PricingInput,
  type ProductCondition
} from "./pricing";
import type {
  AuditView,
  BargainView,
  DemandView,
  NotificationView,
  OfferView,
  PolicyView,
  ProductView,
  RoomSnapshot
} from "./view-types";

type Database = ReturnType<typeof getDb>;
type DbExecutor = Pick<Database, "insert" | "select" | "delete" | "update">;

const SHOPPER_KEY = "shopper-alex";
const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

function newRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => ROOM_ALPHABET[byte % ROOM_ALPHABET.length]).join("");
}

function asIso(value: Date | string) {
  return new Date(value).toISOString();
}

function toEvent(row: typeof eventOutbox.$inferSelect): RoomEvent {
  return {
    id: row.id,
    roomCode: row.roomCode,
    type: row.type,
    payload: row.payload,
    createdAt: asIso(row.createdAt)
  };
}

async function ensureCatalog(db: DbExecutor) {
  await db
    .insert(products)
    .values(CATALOG.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      useCase: product.useCase,
      imagePath: product.imagePath,
      specs: product.specs,
      tags: product.tags,
      listPriceCents: product.listPriceCents,
      excellentPriceCents: product.excellentPriceCents,
      goodPriceCents: product.goodPriceCents,
      defaultNewStock: product.defaultNewStock,
      defaultExcellentStock: product.defaultExcellentStock,
      defaultGoodStock: product.defaultGoodStock
    })))
    .onConflictDoNothing();
}

async function seedRoomState(db: DbExecutor, roomCode: string) {
  await ensureCatalog(db);
  await db.insert(pricingPolicies).values(
    CATALOG.map((product) => ({
      roomCode,
      productId: product.id,
      floorPriceCents: product.floorPriceCents,
      maxInstantDiscountBps: product.maxInstantDiscountBps,
      tierOneCount: 5,
      tierOneDiscountBps: 800,
      tierTwoCount: 10,
      tierTwoDiscountBps: 1200
    }))
  );
  await db.insert(roomInventory).values(
    CATALOG.map((product) => ({
      roomCode,
      productId: product.id,
      newStock: product.defaultNewStock,
      excellentStock: product.defaultExcellentStock,
      goodStock: product.defaultGoodStock
    }))
  );
  await db.insert(groupCommitments).values(
    [1, 2, 3, 4].map((number) => ({
      id: randomUUID(),
      roomCode,
      productId: SHOWCASE_PRODUCT_ID,
      participantKey: `seed-buyer-${number}`
    }))
  );
}

export async function createRoom() {
  const db = getDb();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = newRoomCode();
    const outcome = await db.transaction(async (tx) => {
      const inserted = await tx.insert(rooms).values({ code }).onConflictDoNothing().returning();
      if (!inserted.length) return null;
      await seedRoomState(tx, code);
      await tx.insert(auditEvents).values({
        roomCode: code,
        actor: "system",
        action: "room.created",
        summary: "Seeded a private shopper–merchant demo room.",
        metadata: { showcaseProductId: SHOWCASE_PRODUCT_ID }
      });
      const [event] = await tx
        .insert(eventOutbox)
        .values({ roomCode: code, type: "room.created", payload: { code } })
        .returning();
      return { code, event };
    });

    if (outcome) {
      emitRoomEvent(toEvent(outcome.event));
      return { code: outcome.code };
    }
  }

  throw new AppError("Could not allocate a unique demo room. Please try again.", 503);
}

export async function roomExists(rawCode: string) {
  const code = roomCodeSchema.parse(rawCode);
  const [room] = await getDb().select({ code: rooms.code }).from(rooms).where(eq(rooms.code, code)).limit(1);
  return Boolean(room);
}

function conditionPrice(product: ProductRow, condition: ProductCondition) {
  if (condition === "new") return product.listPriceCents;
  if (condition === "good") return product.goodPriceCents;
  return product.excellentPriceCents;
}

function inventoryFor(
  inventory: typeof roomInventory.$inferSelect,
  condition: ProductCondition
) {
  if (condition === "new") return inventory.newStock;
  if (condition === "good") return inventory.goodStock;
  return inventory.excellentStock;
}

type PricingContext = {
  product: ProductRow;
  policy: PolicyRow;
  inventory: typeof roomInventory.$inferSelect;
  groupCount: number;
  activeBargain: BargainRow | null;
  input: PricingInput;
};

async function getPricingContext(
  db: DbExecutor,
  roomCode: string,
  productId: string,
  condition: ProductCondition
): Promise<PricingContext> {
  const now = new Date();
  const [[product], [policy], [inventory], commitmentRows, bargainRows] = await Promise.all([
    db.select().from(products).where(eq(products.id, productId)).limit(1),
    db
      .select()
      .from(pricingPolicies)
      .where(and(eq(pricingPolicies.roomCode, roomCode), eq(pricingPolicies.productId, productId)))
      .limit(1),
    db
      .select()
      .from(roomInventory)
      .where(and(eq(roomInventory.roomCode, roomCode), eq(roomInventory.productId, productId)))
      .limit(1),
    db
      .select({ id: groupCommitments.id })
      .from(groupCommitments)
      .where(and(eq(groupCommitments.roomCode, roomCode), eq(groupCommitments.productId, productId))),
    db
      .select()
      .from(bargains)
      .where(
        and(
          eq(bargains.roomCode, roomCode),
          eq(bargains.productId, productId),
          eq(bargains.condition, condition),
          eq(bargains.status, "active"),
          gt(bargains.inventory, 0),
          gt(bargains.expiresAt, now)
        )
      )
      .orderBy(asc(bargains.priceCents))
      .limit(1)
  ]);

  if (!product || !policy || !inventory) {
    throw new AppError("Product or room pricing policy was not found.", 404);
  }

  const activeBargain = bargainRows[0] ?? null;
  return {
    product,
    policy,
    inventory,
    groupCount: commitmentRows.length,
    activeBargain,
    input: {
      listPriceCents: product.listPriceCents,
      conditionPriceCents: conditionPrice(product, condition),
      floorPriceCents: policy.floorPriceCents,
      maxInstantDiscountBps: policy.maxInstantDiscountBps,
      groupCount: commitmentRows.length,
      tierOneCount: policy.tierOneCount,
      tierOneDiscountBps: policy.tierOneDiscountBps,
      tierTwoCount: policy.tierTwoCount,
      tierTwoDiscountBps: policy.tierTwoDiscountBps,
      activeBargain: activeBargain
        ? { id: activeBargain.id, priceCents: activeBargain.priceCents }
        : null
    }
  };
}

export async function getRoomSnapshot(rawCode: string, role: Role): Promise<RoomSnapshot> {
  const code = roomCodeSchema.parse(rawCode);
  const db = getDb();
  const now = new Date();
  const [roomRows, productRows, inventoryRows, policyRows, commitmentRows, offerRows, bargainRows, subscriptionRows, notificationRows, auditRows, outboxRows] =
    await Promise.all([
      db.select().from(rooms).where(eq(rooms.code, code)).limit(1),
      db.select().from(products).orderBy(asc(products.listPriceCents)),
      db.select().from(roomInventory).where(eq(roomInventory.roomCode, code)),
      db.select().from(pricingPolicies).where(eq(pricingPolicies.roomCode, code)),
      db.select().from(groupCommitments).where(eq(groupCommitments.roomCode, code)),
      db.select().from(offers).where(eq(offers.roomCode, code)).orderBy(desc(offers.createdAt)).limit(30),
      db.select().from(bargains).where(eq(bargains.roomCode, code)).orderBy(desc(bargains.createdAt)).limit(30),
      db.select().from(subscriptions).where(and(eq(subscriptions.roomCode, code), eq(subscriptions.active, 1))),
      db.select().from(notifications).where(eq(notifications.roomCode, code)).orderBy(desc(notifications.createdAt)).limit(30),
      db.select().from(auditEvents).where(eq(auditEvents.roomCode, code)).orderBy(desc(auditEvents.createdAt)).limit(30),
      db.select().from(eventOutbox).where(eq(eventOutbox.roomCode, code)).orderBy(desc(eventOutbox.id)).limit(1)
    ]);

  const room = roomRows[0];
  if (!room) throw new AppError("Demo room not found.", 404);

  const inventoryByProduct = new Map(inventoryRows.map((row) => [row.productId, row]));
  const policyByProduct = new Map(policyRows.map((row) => [row.productId, row]));
  const productById = new Map(productRows.map((row) => [row.id, row]));
  const bargainById = new Map(bargainRows.map((row) => [row.id, row]));
  const groupCountByProduct = new Map<string, number>();
  for (const row of commitmentRows) {
    groupCountByProduct.set(row.productId, (groupCountByProduct.get(row.productId) ?? 0) + 1);
  }

  const productViews: ProductView[] = productRows.flatMap((product) => {
    const inventory = inventoryByProduct.get(product.id);
    const policy = policyByProduct.get(product.id);
    if (!inventory || !policy) return [];
    const groupCount = groupCountByProduct.get(product.id) ?? 0;
    const activeBargains = bargainRows
      .filter(
        (bargain) =>
          bargain.productId === product.id &&
          bargain.status === "active" &&
          bargain.inventory > 0 &&
          bargain.expiresAt > now
      );
    const activeBargain = activeBargains
      .filter((bargain) => bargain.condition === "excellent")
      .sort((a, b) => a.priceCents - b.priceCents)[0];
    const priceInput: PricingInput = {
      listPriceCents: product.listPriceCents,
      conditionPriceCents: product.excellentPriceCents,
      floorPriceCents: policy.floorPriceCents,
      maxInstantDiscountBps: policy.maxInstantDiscountBps,
      groupCount,
      tierOneCount: policy.tierOneCount,
      tierOneDiscountBps: policy.tierOneDiscountBps,
      tierTwoCount: policy.tierTwoCount,
      tierTwoDiscountBps: policy.tierTwoDiscountBps,
      activeBargain: activeBargain ? { id: activeBargain.id, priceCents: activeBargain.priceCents } : null
    };
    const tier = getGroupTier(priceInput);
    const bestPriceByCondition = (["new", "excellent", "good"] as const).reduce(
      (prices, condition) => {
        const conditionBargain = activeBargains
          .filter((bargain) => bargain.condition === condition)
          .sort((a, b) => a.priceCents - b.priceCents)[0];
        const basePrice = conditionPrice(product, condition);
        prices[condition] = Math.min(
          basePrice,
          tier ? discountedPrice(basePrice, tier.discountBps) : Number.MAX_SAFE_INTEGER,
          conditionBargain?.priceCents ?? Number.MAX_SAFE_INTEGER
        );
        return prices;
      },
      {} as Record<ProductCondition, number>
    );
    const nextGroupCount = groupCount < policy.tierOneCount
      ? policy.tierOneCount
      : groupCount < policy.tierTwoCount
        ? policy.tierTwoCount
        : null;

    return [{
      id: product.id,
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      useCase: product.useCase,
      imagePath: product.imagePath,
      specs: product.specs,
      tags: product.tags,
      listPriceCents: product.listPriceCents,
      excellentPriceCents: product.excellentPriceCents,
      goodPriceCents: product.goodPriceCents,
      stock: {
        new: inventory.newStock,
        excellent: inventory.excellentStock,
        good: inventory.goodStock
      },
      groupCount,
      nextGroupCount,
      groupDiscountPercent: (tier?.discountBps ?? policy.tierOneDiscountBps) / 100,
      bestPriceCents: bestPriceByCondition.excellent,
      bestPriceByCondition,
      activeBargain: activeBargain
        ? {
            id: activeBargain.id,
            condition: activeBargain.condition as ProductCondition,
            priceCents: activeBargain.priceCents,
            inventory: activeBargain.inventory,
            message: activeBargain.message,
            expiresAt: asIso(activeBargain.expiresAt)
          }
        : undefined
    }];
  });

  const offerViews: OfferView[] = offerRows.map((offer) => ({
    id: offer.id,
    productId: offer.productId,
    productName: productById.get(offer.productId)?.name ?? offer.productId,
    condition: offer.condition as ProductCondition,
    targetPriceCents: offer.targetPriceCents,
    offeredPriceCents: offer.offeredPriceCents,
    priceSource: offer.priceSource,
    status: offer.status !== "checked_out" && offer.expiresAt <= now ? "expired" : offer.status,
    rationale: offer.rationale,
    createdAt: asIso(offer.createdAt),
    expiresAt: asIso(offer.expiresAt)
  }));

  const bargainViews: BargainView[] = bargainRows.map((bargain) => ({
    id: bargain.id,
    productId: bargain.productId,
    productName: productById.get(bargain.productId)?.name ?? bargain.productId,
    condition: bargain.condition as ProductCondition,
    priceCents: bargain.priceCents,
    inventory: bargain.inventory,
    message: bargain.message,
    status: bargain.status === "active" && bargain.expiresAt <= now ? "expired" : bargain.status,
    createdAt: asIso(bargain.createdAt),
    expiresAt: asIso(bargain.expiresAt)
  }));

  const notificationViews: NotificationView[] = notificationRows.map((notification) => {
    const bargain = bargainById.get(notification.bargainId);
    return {
      id: notification.id,
      productName: bargain ? productById.get(bargain.productId)?.name ?? bargain.productId : "Product",
      bargainId: notification.bargainId,
      title: notification.title,
      message: notification.message,
      read: Boolean(notification.readAt),
      createdAt: asIso(notification.createdAt)
    };
  });

  const demandViews: DemandView[] = productRows.map((product) => {
    const productSubscriptions = subscriptionRows.filter((item) => item.productId === product.id);
    const productOffers = offerRows.filter((item) => item.productId === product.id);
    return {
      productId: product.id,
      productName: product.name,
      groupCount: groupCountByProduct.get(product.id) ?? 0,
      subscriberCount: productSubscriptions.length,
      averageTargetPriceCents: productSubscriptions.length
        ? Math.round(productSubscriptions.reduce((sum, item) => sum + item.targetPriceCents, 0) / productSubscriptions.length)
        : null,
      offerCount: productOffers.length
    };
  });

  const policyViews: PolicyView[] = policyRows.map((policy) => ({
    productId: policy.productId,
    productName: productById.get(policy.productId)?.name ?? policy.productId,
    floorPriceCents: policy.floorPriceCents,
    maxInstantDiscountPercent: policy.maxInstantDiscountBps / 100,
    tierOneCount: policy.tierOneCount,
    tierOneDiscountPercent: policy.tierOneDiscountBps / 100,
    tierTwoCount: policy.tierTwoCount,
    tierTwoDiscountPercent: policy.tierTwoDiscountBps / 100
  }));

  const auditViews: AuditView[] = auditRows.map((event) => ({
    id: event.id,
    actor: event.actor,
    action: event.action,
    summary: event.summary,
    createdAt: asIso(event.createdAt)
  }));

  return {
    room: { code: room.code, createdAt: asIso(room.createdAt), resetAt: asIso(room.resetAt) },
    role,
    products: productViews,
    offers: offerViews,
    bargains: bargainViews,
    notifications: role === "shopper" ? notificationViews : [],
    demand: role === "merchant" ? demandViews : [],
    policies: role === "merchant" ? policyViews : [],
    audit: role === "merchant" ? auditViews : [],
    latestEventId: outboxRows[0]?.id ?? 0
  };
}

function compactProduct(product: ProductView, condition?: ProductCondition) {
  return {
    id: product.id,
    name: product.name,
    useCase: product.useCase,
    listPriceCents: product.listPriceCents,
    refurbishedExcellentCents: product.excellentPriceCents,
    condition: condition ?? "excellent",
    bestPriceCents: condition ? product.bestPriceByCondition[condition] : product.bestPriceCents,
    groupCount: product.groupCount,
    tags: product.tags
  };
}

function allowedAction(role: Role, action: ActionName) {
  return role === "shopper"
    ? shopperActions.includes(action as (typeof shopperActions)[number])
    : merchantActions.includes(action as (typeof merchantActions)[number]);
}

export async function executeRoomAction(
  rawCode: string,
  role: Role,
  action: ActionName,
  rawInput: Record<string, unknown>
): Promise<ToolResult> {
  const roomCode = roomCodeSchema.parse(rawCode);
  if (!allowedAction(role, action)) {
    throw new AppError(`The ${action} action is not available in the ${role} view.`, 403);
  }
  if (!(await roomExists(roomCode))) throw new AppError("Demo room not found.", 404);

  const input = actionInputSchemas[action].parse(rawInput) as Record<string, unknown>;
  const db = getDb();

  if (action === "search_products") {
    const snapshot = await getRoomSnapshot(roomCode, "shopper");
    const query = String(input.query ?? "").toLowerCase();
    const maxPrice = input.maxPriceCents as number | undefined;
    const condition = input.condition as ProductCondition | undefined;
    const useCase = String(input.useCase ?? "").toLowerCase();
    const matches = snapshot.products.filter((product) => {
      const haystack = `${product.name} ${product.tagline} ${product.description} ${product.useCase} ${product.tags.join(" ")}`.toLowerCase();
      return (!query || haystack.includes(query)) &&
        (!useCase || haystack.includes(useCase)) &&
        (!condition || product.stock[condition] > 0) &&
        (!maxPrice || (condition ? product.bestPriceByCondition[condition] : product.bestPriceCents) <= maxPrice);
    }).slice(0, 5);
    return {
      ok: true,
      summary: matches.length ? `Found ${matches.length} laptop match(es).` : "No laptop matched those preferences.",
      data: matches.map((product) => compactProduct(product, condition)),
      nextActions: matches.length ? ["Use get_price_options for a shortlisted product."] : ["Increase the budget or broaden the query."]
    };
  }

  if (action === "get_price_options") {
    const context = await getPricingContext(
      db,
      roomCode,
      String(input.productId),
      input.condition as ProductCondition
    );
    return {
      ok: true,
      summary: `Compared ${context.product.name} price paths for ${input.condition} condition.`,
      data: {
        productId: context.product.id,
        productName: context.product.name,
        condition: input.condition,
        groupCount: context.groupCount,
        options: buildPriceOptions(context.input)
      },
      nextActions: ["Request a rule-bound offer or join the group buy."]
    };
  }

  if (action === "get_notifications") {
    const snapshot = await getRoomSnapshot(roomCode, "shopper");
    const unreadOnly = Boolean(input.unreadOnly);
    const items = snapshot.notifications.filter((item) => !unreadOnly || !item.read).slice(0, 4);
    return {
      ok: true,
      summary: `${items.length} bargain notification(s) available.`,
      data: items,
      nextActions: items.length ? ["Inspect the bargain, then request an offer."] : ["Subscribe to a product and target price."]
    };
  }

  if (action === "get_demand_summary") {
    const snapshot = await getRoomSnapshot(roomCode, "merchant");
    const productId = input.productId as string | undefined;
    const demand = snapshot.demand.filter((item) => !productId || item.productId === productId);
    return {
      ok: true,
      summary: `Aggregated demand for ${demand.length} product(s) without exposing individual shopper budgets.`,
      data: demand,
      nextActions: ["Publish a targeted bargain or adjust a pricing policy."]
    };
  }

  if (action === "get_offer_activity") {
    const snapshot = await getRoomSnapshot(roomCode, "merchant");
    const productId = input.productId as string | undefined;
    const activity = snapshot.offers.filter((item) => !productId || item.productId === productId).slice(0, 6);
    return {
      ok: true,
      summary: `${activity.length} recent offer event(s).`,
      data: activity,
      nextActions: ["Use demand signals to tune policy or publish a bargain."]
    };
  }

  if (action === "request_offer") {
    const productId = String(input.productId);
    const condition = input.condition as ProductCondition;
    const targetPriceCents = Number(input.targetPriceCents);
    const context = await getPricingContext(db, roomCode, productId, condition);
    if (inventoryFor(context.inventory, condition) < 1) throw new AppError("That condition is out of stock.", 409);
    const negotiation = negotiatePrice(context.input, targetPriceCents);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const outcome = await db.transaction(async (tx) => {
      const [offer] = await tx
        .insert(offers)
        .values({
          id: randomUUID(),
          roomCode,
          productId,
          condition,
          targetPriceCents,
          offeredPriceCents: negotiation.offeredPriceCents,
          priceSource: negotiation.priceSource,
          sourceBargainId: negotiation.sourceBargainId,
          status: negotiation.status,
          rationale: negotiation.rationale,
          expiresAt
        })
        .returning();
      await tx.insert(auditEvents).values({
        roomCode,
        actor: "shopper agent",
        action: "offer.requested",
        summary: `${context.product.name}: ${negotiation.status} offer created.`,
        metadata: { offerId: offer.id, condition, priceSource: offer.priceSource }
      });
      const [event] = await tx
        .insert(eventOutbox)
        .values({
          roomCode,
          type: "offer.created",
          payload: { offerId: offer.id, productId, status: offer.status }
        })
        .returning();
      return { offer, event };
    });
    emitRoomEvent(toEvent(outcome.event));
    return {
      ok: true,
      summary: `${context.product.name} ${negotiation.status === "accepted" ? "offer accepted" : "counteroffer ready"} at ${negotiation.offeredPriceCents} cents.`,
      data: {
        offerId: outcome.offer.id,
        productId,
        productName: context.product.name,
        condition,
        targetPriceCents,
        offeredPriceCents: negotiation.offeredPriceCents,
        status: negotiation.status,
        rationale: negotiation.rationale,
        expiresAt: expiresAt.toISOString()
      },
      nextActions: ["Review the offer and use prepare_mock_checkout before it expires."]
    };
  }

  if (action === "join_group_buy") {
    const productId = String(input.productId);
    const outcome = await db.transaction(async (tx) => {
      const [product] = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
      const [policy] = await tx
        .select()
        .from(pricingPolicies)
        .where(and(eq(pricingPolicies.roomCode, roomCode), eq(pricingPolicies.productId, productId)))
        .limit(1);
      if (!product || !policy) throw new AppError("Product was not found.", 404);
      const inserted = await tx
        .insert(groupCommitments)
        .values({ id: randomUUID(), roomCode, productId, participantKey: SHOPPER_KEY })
        .onConflictDoNothing()
        .returning({ id: groupCommitments.id });
      const commitments = await tx
        .select({ id: groupCommitments.id })
        .from(groupCommitments)
        .where(and(eq(groupCommitments.roomCode, roomCode), eq(groupCommitments.productId, productId)));
      const count = commitments.length;
      const discountBps = count >= policy.tierTwoCount
        ? policy.tierTwoDiscountBps
        : count >= policy.tierOneCount
          ? policy.tierOneDiscountBps
          : 0;
      if (!inserted.length) return { product, count, discountBps, event: null, joined: false };
      await tx.insert(auditEvents).values({
        roomCode,
        actor: "shopper",
        action: "group.joined",
        summary: `${product.name} group now has ${count} commitment(s).`,
        metadata: { productId, count, discountBps }
      });
      const [event] = await tx
        .insert(eventOutbox)
        .values({ roomCode, type: "group.updated", payload: { productId, count, discountBps } })
        .returning();
      return { product, count, discountBps, event, joined: true };
    });
    if (outcome.event) emitRoomEvent(toEvent(outcome.event));
    return {
      ok: true,
      summary: !outcome.joined
        ? `Already joined ${outcome.product.name}; the group remains at ${outcome.count} buyers.`
        : outcome.discountBps
        ? `${outcome.count} buyers unlocked ${outcome.discountBps / 100}% off ${outcome.product.name}.`
        : `Joined ${outcome.product.name}; the group now has ${outcome.count} buyers.`,
      data: {
        productId,
        joined: outcome.joined,
        groupCount: outcome.count,
        unlockedDiscountPercent: outcome.discountBps / 100
      },
      nextActions: ["Compare the newly unlocked group price."]
    };
  }

  if (action === "subscribe_bargains") {
    const productId = String(input.productId);
    const condition = String(input.condition);
    const targetPriceCents = Number(input.targetPriceCents);
    const outcome = await db.transaction(async (tx) => {
      const [product] = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
      if (!product) throw new AppError("Product was not found.", 404);
      const [subscription] = await tx
        .insert(subscriptions)
        .values({
          id: randomUUID(),
          roomCode,
          productId,
          subscriberKey: SHOPPER_KEY,
          condition,
          targetPriceCents,
          active: 1,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: [subscriptions.roomCode, subscriptions.productId, subscriptions.subscriberKey, subscriptions.condition],
          set: { targetPriceCents, active: 1, updatedAt: new Date() }
        })
        .returning();
      await tx.insert(auditEvents).values({
        roomCode,
        actor: "shopper",
        action: "subscription.saved",
        summary: `Watching ${product.name} for a qualifying bargain.`,
        metadata: { subscriptionId: subscription.id, condition }
      });
      const [event] = await tx
        .insert(eventOutbox)
        .values({ roomCode, type: "subscription.saved", payload: { productId, condition } })
        .returning();
      return { subscription, product, event };
    });
    emitRoomEvent(toEvent(outcome.event));
    return {
      ok: true,
      summary: `Subscribed to ${outcome.product.name} bargains at or below ${targetPriceCents} cents.`,
      data: { subscriptionId: outcome.subscription.id, productId, condition, targetPriceCents },
      nextActions: ["The merchant agent can now publish a matching bargain."]
    };
  }

  if (action === "prepare_mock_checkout") {
    const offerId = String(input.offerId);
    const outcome = await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(mockOrders).where(eq(mockOrders.offerId, offerId)).limit(1);
      if (existing) {
        const [product] = await tx.select().from(products).where(eq(products.id, existing.productId)).limit(1);
        return { order: existing, product, event: null };
      }
      const now = new Date();
      const [offer] = await tx
        .update(offers)
        .set({ status: "checking_out" })
        .where(
          and(
            eq(offers.id, offerId),
            eq(offers.roomCode, roomCode),
            gt(offers.expiresAt, now),
            or(eq(offers.status, "accepted"), eq(offers.status, "countered"))
          )
        )
        .returning();
      if (!offer) {
        const [completed] = await tx.select().from(mockOrders).where(eq(mockOrders.offerId, offerId)).limit(1);
        if (completed) {
          const [product] = await tx.select().from(products).where(eq(products.id, completed.productId)).limit(1);
          return { order: completed, product, event: null };
        }
        const [unavailable] = await tx
          .select()
          .from(offers)
          .where(and(eq(offers.id, offerId), eq(offers.roomCode, roomCode)))
          .limit(1);
        if (!unavailable) throw new AppError("Offer was not found.", 404);
        if (unavailable.expiresAt <= now) throw new AppError("This offer has expired. Request a fresh offer.", 409);
        throw new AppError("This offer is not available for checkout.", 409);
      }
      const condition = offer.condition as ProductCondition;
      const stockColumn = condition === "new"
        ? roomInventory.newStock
        : condition === "good"
          ? roomInventory.goodStock
          : roomInventory.excellentStock;
      const stockField = condition === "new" ? "newStock" : condition === "good" ? "goodStock" : "excellentStock";
      const updatedInventory = await tx
        .update(roomInventory)
        .set({ [stockField]: sql`${stockColumn} - 1`, updatedAt: new Date() })
        .where(
          and(
            eq(roomInventory.roomCode, roomCode),
            eq(roomInventory.productId, offer.productId),
            gt(stockColumn, 0)
          )
        )
        .returning();
      if (!updatedInventory.length) throw new AppError("That condition just went out of stock.", 409);
      if (offer.sourceBargainId) {
        const updatedBargain = await tx
          .update(bargains)
          .set({ inventory: sql`${bargains.inventory} - 1` })
          .where(and(eq(bargains.id, offer.sourceBargainId), gt(bargains.inventory, 0)))
          .returning();
        if (!updatedBargain.length) throw new AppError("The limited bargain has sold out.", 409);
      }
      const [order] = await tx
        .insert(mockOrders)
        .values({
          id: randomUUID(),
          roomCode,
          offerId,
          productId: offer.productId,
          condition,
          priceCents: offer.offeredPriceCents,
          status: "placed"
        })
        .returning();
      await tx.update(offers).set({ status: "checked_out" }).where(eq(offers.id, offerId));
      const [product] = await tx.select().from(products).where(eq(products.id, offer.productId)).limit(1);
      await tx.insert(auditEvents).values({
        roomCode,
        actor: "shopper + agent",
        action: "mock_order.placed",
        summary: `Human-approved mock checkout completed for ${product?.name ?? offer.productId}.`,
        metadata: { orderId: order.id, offerId }
      });
      const [event] = await tx
        .insert(eventOutbox)
        .values({
          roomCode,
          type: "mock_order.placed",
          payload: { orderId: order.id, productId: offer.productId }
        })
        .returning();
      return { order, product, event };
    });
    if (outcome.event) emitRoomEvent(toEvent(outcome.event));
    return {
      ok: true,
      summary: `Mock order ${outcome.order.id.slice(0, 8).toUpperCase()} placed for ${outcome.product?.name ?? "the selected laptop"}.`,
      data: {
        orderId: outcome.order.id,
        productId: outcome.order.productId,
        productName: outcome.product?.name,
        condition: outcome.order.condition,
        priceCents: outcome.order.priceCents,
        status: outcome.order.status
      },
      nextActions: ["Review the receipt in the shopper activity panel."]
    };
  }

  if (action === "set_pricing_policy") {
    const productId = String(input.productId);
    const floorPriceCents = Number(input.floorPriceCents);
    const maxInstantDiscountBps = Number(input.maxInstantDiscountPercent) * 100;
    const tierOneDiscountBps = Number(input.tierOneDiscountPercent) * 100;
    const tierTwoDiscountBps = Number(input.tierTwoDiscountPercent) * 100;
    const outcome = await db.transaction(async (tx) => {
      const [product] = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
      if (!product) throw new AppError("Product was not found.", 404);
      if (floorPriceCents >= product.listPriceCents) {
        throw new AppError("The floor must be below the list price.", 422);
      }
      if (tierTwoDiscountBps < tierOneDiscountBps) {
        throw new AppError("The ten-buyer discount must be at least the five-buyer discount.", 422);
      }
      const [policy] = await tx
        .update(pricingPolicies)
        .set({
          floorPriceCents,
          maxInstantDiscountBps,
          tierOneDiscountBps,
          tierTwoDiscountBps,
          updatedAt: new Date()
        })
        .where(and(eq(pricingPolicies.roomCode, roomCode), eq(pricingPolicies.productId, productId)))
        .returning();
      await tx.insert(auditEvents).values({
        roomCode,
        actor: "merchant + agent",
        action: "policy.updated",
        summary: `Updated ${product.name} negotiation and group-buy guardrails.`,
        metadata: { productId }
      });
      const [event] = await tx
        .insert(eventOutbox)
        .values({ roomCode, type: "policy.updated", payload: { productId } })
        .returning();
      return { product, policy, event };
    });
    emitRoomEvent(toEvent(outcome.event));
    return {
      ok: true,
      summary: `${outcome.product.name} pricing policy updated for future offers.`,
      data: {
        productId,
        maxInstantDiscountPercent: outcome.policy.maxInstantDiscountBps / 100,
        tierOneDiscountPercent: outcome.policy.tierOneDiscountBps / 100,
        tierTwoDiscountPercent: outcome.policy.tierTwoDiscountBps / 100
      },
      nextActions: ["Review demand or publish a targeted bargain."]
    };
  }

  if (action === "publish_bargain") {
    const productId = String(input.productId);
    const condition = input.condition as ProductCondition;
    const priceCents = Number(input.priceCents);
    const bargainInventory = Number(input.inventory);
    const expiresAt = new Date(Date.now() + Number(input.expiresInMinutes) * 60 * 1000);
    const message = String(input.message);
    const outcome = await db.transaction(async (tx) => {
      const context = await getPricingContext(tx, roomCode, productId, condition);
      if (priceCents < context.policy.floorPriceCents) {
        throw new AppError("The bargain price is below the private merchant floor.", 422);
      }
      if (priceCents >= conditionPrice(context.product, condition)) {
        throw new AppError("A bargain must beat the current condition price.", 422);
      }
      if (bargainInventory > inventoryFor(context.inventory, condition)) {
        throw new AppError("Bargain inventory exceeds available room inventory.", 422);
      }
      const [bargain] = await tx
        .insert(bargains)
        .values({
          id: randomUUID(),
          roomCode,
          productId,
          condition,
          priceCents,
          inventory: bargainInventory,
          message,
          status: "active",
          expiresAt
        })
        .returning();
      const matchingSubscriptions = await tx
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.roomCode, roomCode),
            eq(subscriptions.productId, productId),
            eq(subscriptions.active, 1),
            gte(subscriptions.targetPriceCents, priceCents),
            or(eq(subscriptions.condition, "any"), eq(subscriptions.condition, condition))
          )
        );
      if (matchingSubscriptions.length) {
        await tx
          .insert(notifications)
          .values(
            matchingSubscriptions.map((subscription) => ({
              id: randomUUID(),
              roomCode,
              subscriptionId: subscription.id,
              bargainId: bargain.id,
              title: `${context.product.name} hit your target`,
              message: `${message} Price: ${priceCents} cents; ${bargainInventory} available.`
            }))
          )
          .onConflictDoNothing();
      }
      await tx.insert(auditEvents).values({
        roomCode,
        actor: "merchant + agent",
        action: "bargain.published",
        summary: `Published a ${condition} ${context.product.name} bargain; ${matchingSubscriptions.length} subscriber(s) matched.`,
        metadata: { bargainId: bargain.id, productId, matched: matchingSubscriptions.length }
      });
      const [event] = await tx
        .insert(eventOutbox)
        .values({
          roomCode,
          type: "bargain.published",
          payload: { bargainId: bargain.id, productId, notificationCount: matchingSubscriptions.length }
        })
        .returning();
      return { bargain, product: context.product, matched: matchingSubscriptions.length, event };
    });
    emitRoomEvent(toEvent(outcome.event));
    return {
      ok: true,
      summary: `${outcome.product.name} bargain published and ${outcome.matched} matching subscriber(s) notified.`,
      data: {
        bargainId: outcome.bargain.id,
        productId,
        condition,
        priceCents,
        inventory: bargainInventory,
        notificationCount: outcome.matched,
        expiresAt: expiresAt.toISOString()
      },
      nextActions: ["Switch to the shopper view to see the live notification."]
    };
  }

  if (action === "close_bargain") {
    const bargainId = String(input.bargainId);
    const outcome = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(bargains)
        .where(and(eq(bargains.id, bargainId), eq(bargains.roomCode, roomCode)))
        .limit(1);
      if (!existing) throw new AppError("Bargain was not found.", 404);
      const [existingProduct] = await tx.select().from(products).where(eq(products.id, existing.productId)).limit(1);
      if (existing.status === "closed") {
        return { bargain: existing, product: existingProduct, event: null, alreadyClosed: true };
      }
      const [bargain] = await tx
        .update(bargains)
        .set({ status: "closed" })
        .where(and(eq(bargains.id, bargainId), eq(bargains.roomCode, roomCode), eq(bargains.status, "active")))
        .returning();
      if (!bargain) {
        const [current] = await tx.select().from(bargains).where(eq(bargains.id, bargainId)).limit(1);
        return { bargain: current ?? existing, product: existingProduct, event: null, alreadyClosed: true };
      }
      const [product] = await tx.select().from(products).where(eq(products.id, bargain.productId)).limit(1);
      await tx.insert(auditEvents).values({
        roomCode,
        actor: "merchant + agent",
        action: "bargain.closed",
        summary: `Closed the ${product?.name ?? bargain.productId} bargain.`,
        metadata: { bargainId }
      });
      const [event] = await tx
        .insert(eventOutbox)
        .values({ roomCode, type: "bargain.closed", payload: { bargainId, productId: bargain.productId } })
        .returning();
      return { bargain, product, event, alreadyClosed: false };
    });
    if (outcome.event) emitRoomEvent(toEvent(outcome.event));
    return {
      ok: true,
      summary: outcome.alreadyClosed
        ? `${outcome.product?.name ?? "Product"} bargain was already closed.`
        : `${outcome.product?.name ?? "Product"} bargain closed.`,
      data: { bargainId, status: "closed" },
      nextActions: ["Publish a replacement bargain when demand changes."]
    };
  }

  throw new AppError("Action is not implemented.", 501);
}

export async function resetRoom(rawCode: string) {
  const roomCode = roomCodeSchema.parse(rawCode);
  const db = getDb();
  const outcome = await db.transaction(async (tx) => {
    const [room] = await tx.select().from(rooms).where(eq(rooms.code, roomCode)).limit(1);
    if (!room) throw new AppError("Demo room not found.", 404);
    await tx.delete(mockOrders).where(eq(mockOrders.roomCode, roomCode));
    await tx.delete(notifications).where(eq(notifications.roomCode, roomCode));
    await tx.delete(subscriptions).where(eq(subscriptions.roomCode, roomCode));
    await tx.delete(bargains).where(eq(bargains.roomCode, roomCode));
    await tx.delete(offers).where(eq(offers.roomCode, roomCode));
    await tx.delete(groupCommitments).where(eq(groupCommitments.roomCode, roomCode));
    await tx.delete(pricingPolicies).where(eq(pricingPolicies.roomCode, roomCode));
    await tx.delete(roomInventory).where(eq(roomInventory.roomCode, roomCode));
    await tx.delete(auditEvents).where(eq(auditEvents.roomCode, roomCode));
    await tx.delete(eventOutbox).where(eq(eventOutbox.roomCode, roomCode));
    await seedRoomState(tx, roomCode);
    const resetAt = new Date();
    await tx.update(rooms).set({ resetAt }).where(eq(rooms.code, roomCode));
    await tx.insert(auditEvents).values({
      roomCode,
      actor: "human",
      action: "room.reset",
      summary: "Restored the deterministic competition demo state.",
      metadata: {}
    });
    const [event] = await tx
      .insert(eventOutbox)
      .values({ roomCode, type: "room.reset", payload: { resetAt: resetAt.toISOString() } })
      .returning();
    return { resetAt, event };
  });
  emitRoomEvent(toEvent(outcome.event));
  return { ok: true, code: roomCode, resetAt: outcome.resetAt.toISOString() };
}

export async function getOutboxAfter(rawCode: string, after: number) {
  const roomCode = roomCodeSchema.parse(rawCode);
  return getDb()
    .select()
    .from(eventOutbox)
    .where(and(eq(eventOutbox.roomCode, roomCode), gt(eventOutbox.id, Math.max(0, after))))
    .orderBy(asc(eventOutbox.id))
    .limit(100)
    .then((rows) => rows.map((row) => toEvent(row)));
}
