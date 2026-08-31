import type { Role, ToolResult } from "./contracts";
import type { ProductCondition } from "./pricing";

export type PriceOptionView = {
  source: "condition" | "group" | "bargain";
  label: string;
  priceCents: number;
  available: boolean;
  detail: string;
};

export type ProductView = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  useCase: string;
  imagePath: string;
  specs: string[];
  tags: string[];
  listPriceCents: number;
  excellentPriceCents: number;
  goodPriceCents: number;
  stock: { new: number; excellent: number; good: number };
  groupCount: number;
  nextGroupCount: number | null;
  groupDiscountPercent: number;
  bestPriceCents: number;
  bestPriceByCondition: Record<ProductCondition, number>;
  activeBargain?: {
    id: string;
    condition: ProductCondition;
    priceCents: number;
    inventory: number;
    message: string;
    expiresAt: string;
  };
};

export type OfferView = {
  id: string;
  productId: string;
  productName: string;
  condition: ProductCondition;
  targetPriceCents: number;
  offeredPriceCents: number;
  priceSource: string;
  status: string;
  rationale: string;
  createdAt: string;
  expiresAt: string;
};

export type BargainView = {
  id: string;
  productId: string;
  productName: string;
  condition: ProductCondition;
  priceCents: number;
  inventory: number;
  message: string;
  status: string;
  createdAt: string;
  expiresAt: string;
};

export type NotificationView = {
  id: string;
  productName: string;
  bargainId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type DemandView = {
  productId: string;
  productName: string;
  groupCount: number;
  subscriberCount: number;
  averageTargetPriceCents: number | null;
  offerCount: number;
};

export type PolicyView = {
  productId: string;
  productName: string;
  floorPriceCents: number;
  maxInstantDiscountPercent: number;
  tierOneCount: number;
  tierOneDiscountPercent: number;
  tierTwoCount: number;
  tierTwoDiscountPercent: number;
};

export type AuditView = {
  id: number;
  actor: string;
  action: string;
  summary: string;
  createdAt: string;
};

export type RoomSnapshot = {
  room: { code: string; createdAt: string; resetAt: string };
  role: Role;
  products: ProductView[];
  offers: OfferView[];
  bargains: BargainView[];
  notifications: NotificationView[];
  demand: DemandView[];
  policies: PolicyView[];
  audit: AuditView[];
  latestEventId: number;
};

export type ActionExecutor = (action: string, input: Record<string, unknown>) => Promise<ToolResult>;
