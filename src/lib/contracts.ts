import { z } from "zod";

export const roomCodeSchema = z.string().trim().toUpperCase().regex(/^[A-HJ-NP-Z2-9]{6}$/);
export const productConditionSchema = z.enum(["new", "excellent", "good"]);
export const subscriptionConditionSchema = z.enum(["any", "new", "excellent", "good"]);

const productId = z.string().min(2).max(80);
const priceCents = z.number().int().min(10_000).max(1_000_000);

export const actionInputSchemas = {
  search_products: z.object({
    query: z.string().trim().max(80).optional(),
    maxPriceCents: priceCents.optional(),
    condition: productConditionSchema.optional(),
    useCase: z.string().trim().max(60).optional()
  }),
  get_price_options: z.object({ productId, condition: productConditionSchema.default("excellent") }),
  request_offer: z.object({
    productId,
    condition: productConditionSchema.default("excellent"),
    targetPriceCents: priceCents
  }),
  join_group_buy: z.object({ productId }),
  subscribe_bargains: z.object({
    productId,
    condition: subscriptionConditionSchema.default("any"),
    targetPriceCents: priceCents
  }),
  get_notifications: z.object({ unreadOnly: z.boolean().default(false) }),
  prepare_mock_checkout: z.object({ offerId: z.string().uuid() }),
  get_demand_summary: z.object({ productId: productId.optional() }),
  get_offer_activity: z.object({ productId: productId.optional() }),
  set_pricing_policy: z.object({
    productId,
    floorPriceCents: priceCents,
    maxInstantDiscountPercent: z.number().int().min(0).max(25),
    tierOneDiscountPercent: z.number().int().min(1).max(25).default(8),
    tierTwoDiscountPercent: z.number().int().min(1).max(30).default(12)
  }),
  publish_bargain: z.object({
    productId,
    condition: productConditionSchema,
    priceCents,
    inventory: z.number().int().min(1).max(100),
    expiresInMinutes: z.number().int().min(5).max(1440).default(60),
    message: z.string().trim().min(3).max(240)
  }),
  close_bargain: z.object({ bargainId: z.string().uuid() })
} as const;

export type ActionName = keyof typeof actionInputSchemas;
export const shopperActions = [
  "search_products",
  "get_price_options",
  "request_offer",
  "join_group_buy",
  "subscribe_bargains",
  "get_notifications",
  "prepare_mock_checkout"
] as const satisfies readonly ActionName[];
export const merchantActions = [
  "get_demand_summary",
  "get_offer_activity",
  "set_pricing_policy",
  "publish_bargain",
  "close_bargain"
] as const satisfies readonly ActionName[];

export type Role = "shopper" | "merchant";

export const actionRequestSchema = z.object({
  role: z.enum(["shopper", "merchant"]),
  action: z.enum(Object.keys(actionInputSchemas) as [ActionName, ...ActionName[]]),
  input: z.record(z.string(), z.unknown()).default({})
});

export type ToolResult = {
  ok: boolean;
  summary: string;
  data?: unknown;
  nextActions?: string[];
};

