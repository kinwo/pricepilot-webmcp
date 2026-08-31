import type { Role } from "./contracts";

export type WebMCPDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  readOnly: boolean;
  untrustedContent?: boolean;
  approval?: {
    title: string;
    description: string;
    confirmLabel: string;
  };
};

const conditionProperty = {
  type: "string",
  enum: ["new", "excellent", "good"],
  description: "Requested laptop condition."
};

export const shopperToolDefinitions: WebMCPDefinition[] = [
  {
    name: "search_products",
    title: "Search laptops",
    description: "Find laptops by plain-language need, use case, condition, or maximum budget. Returns up to five compact matches and current best prices.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Need or feature, such as lightweight coding laptop." },
        maxPriceCents: { type: "integer", minimum: 10000, description: "Maximum budget in US cents." },
        condition: conditionProperty,
        useCase: { type: "string", description: "Use case such as education, business, or creative work." }
      }
    },
    readOnly: true
  },
  {
    name: "get_price_options",
    title: "Compare price paths",
    description: "Compare current condition, unlocked group-buy, and active bargain prices for one laptop. This does not reserve or buy anything.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Product ID returned by search_products." },
        condition: conditionProperty
      },
      required: ["productId"]
    },
    readOnly: true
  },
  {
    name: "request_offer",
    title: "Request a rule-bound offer",
    description: "Ask for a target price on one laptop. Creates a non-binding 10-minute offer or transparent counteroffer using merchant pricing guardrails.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Product ID returned by search_products." },
        condition: conditionProperty,
        targetPriceCents: { type: "integer", minimum: 10000, description: "Target price in US cents." }
      },
      required: ["productId", "targetPriceCents"]
    },
    readOnly: false
  },
  {
    name: "join_group_buy",
    title: "Join group buy",
    description: "Record this shopper's non-binding group-buy commitment for one laptop. May unlock a demand-based discount for everyone in the room.",
    inputSchema: {
      type: "object",
      properties: { productId: { type: "string", description: "Product ID to join." } },
      required: ["productId"]
    },
    readOnly: false,
    approval: {
      title: "Join this group buy?",
      description: "This records a visible, non-binding commitment in the shared demo room. No order or payment is created.",
      confirmLabel: "Join the group"
    }
  },
  {
    name: "subscribe_bargains",
    title: "Subscribe to bargains",
    description: "Save a product, condition, and target price. Future qualifying merchant bargains create a persisted in-app notification.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Product ID to watch." },
        condition: { type: "string", enum: ["any", "new", "excellent", "good"], description: "Acceptable condition." },
        targetPriceCents: { type: "integer", minimum: 10000, description: "Notify at or below this US-cent price." }
      },
      required: ["productId", "targetPriceCents"]
    },
    readOnly: false,
    approval: {
      title: "Save this bargain subscription?",
      description: "The merchant will see only aggregate demand. Your individual target stays inside this demo room.",
      confirmLabel: "Save subscription"
    }
  },
  {
    name: "get_notifications",
    title: "Get bargain notifications",
    description: "Read this shopper's in-app bargain notifications. Merchant-authored messages are returned as untrusted content.",
    inputSchema: {
      type: "object",
      properties: { unreadOnly: { type: "boolean", description: "Return only unread notifications." } }
    },
    readOnly: true,
    untrustedContent: true
  },
  {
    name: "prepare_mock_checkout",
    title: "Complete mock checkout",
    description: "Place a fictional mock order from an unexpired offer after the human reviews a visible confirmation. No payment or personal data is collected.",
    inputSchema: {
      type: "object",
      properties: { offerId: { type: "string", description: "Offer ID returned by request_offer." } },
      required: ["offerId"]
    },
    readOnly: false,
    approval: {
      title: "Approve mock checkout?",
      description: "This places a fictional order and decrements demo inventory. No payment or personal information is involved.",
      confirmLabel: "Place mock order"
    }
  }
];

export const merchantToolDefinitions: WebMCPDefinition[] = [
  {
    name: "get_demand_summary",
    title: "Review aggregate demand",
    description: "Review group commitments, subscriber counts, target-price averages, and offer volume without revealing individual shopper budgets.",
    inputSchema: {
      type: "object",
      properties: { productId: { type: "string", description: "Optional product ID to narrow results." } }
    },
    readOnly: true
  },
  {
    name: "get_offer_activity",
    title: "Review offer activity",
    description: "Read recent accepted, countered, expired, and checked-out offers for all products or one selected product.",
    inputSchema: {
      type: "object",
      properties: { productId: { type: "string", description: "Optional product ID to narrow results." } }
    },
    readOnly: true
  },
  {
    name: "set_pricing_policy",
    title: "Set pricing guardrails",
    description: "Update a product's private floor, maximum instant negotiation discount, and five- and ten-buyer group discounts for future offers.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Product ID to update." },
        floorPriceCents: { type: "integer", minimum: 10000, description: "Private minimum in US cents." },
        maxInstantDiscountPercent: { type: "integer", minimum: 0, maximum: 25, description: "Maximum extra instant discount percentage." },
        tierOneDiscountPercent: { type: "integer", minimum: 1, maximum: 25, description: "Discount at five buyers." },
        tierTwoDiscountPercent: { type: "integer", minimum: 1, maximum: 30, description: "Discount at ten buyers." }
      },
      required: ["productId", "floorPriceCents", "maxInstantDiscountPercent"]
    },
    readOnly: false,
    approval: {
      title: "Update merchant pricing guardrails?",
      description: "These private settings affect future shopper offers and group prices in this room.",
      confirmLabel: "Update policy"
    }
  },
  {
    name: "publish_bargain",
    title: "Publish targeted bargain",
    description: "Publish a limited, expiring bargain. Matching subscriber intents immediately receive an in-app notification.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Product ID for the bargain." },
        condition: conditionProperty,
        priceCents: { type: "integer", minimum: 10000, description: "Bargain price in US cents." },
        inventory: { type: "integer", minimum: 1, maximum: 100, description: "Units allocated to the bargain." },
        expiresInMinutes: { type: "integer", minimum: 5, maximum: 1440, description: "Minutes until expiry." },
        message: { type: "string", maxLength: 240, description: "Short shopper-facing bargain message." }
      },
      required: ["productId", "condition", "priceCents", "inventory", "message"]
    },
    readOnly: false,
    untrustedContent: true,
    approval: {
      title: "Publish this bargain?",
      description: "Qualifying shopper subscriptions will be notified immediately and the bargain becomes visible in the room.",
      confirmLabel: "Publish bargain"
    }
  },
  {
    name: "close_bargain",
    title: "Close bargain",
    description: "Close an active bargain so it is no longer offered to shoppers. Existing notifications remain visible as an audit trail.",
    inputSchema: {
      type: "object",
      properties: { bargainId: { type: "string", description: "Active bargain ID." } },
      required: ["bargainId"]
    },
    readOnly: false,
    approval: {
      title: "Close this bargain?",
      description: "The offer will stop being available to shoppers in this demo room.",
      confirmLabel: "Close bargain"
    }
  }
];

export function getToolDefinitions(role: Role) {
  return role === "shopper" ? shopperToolDefinitions : merchantToolDefinitions;
}

