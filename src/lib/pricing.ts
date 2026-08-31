export type ProductCondition = "new" | "excellent" | "good";

export type PricingInput = {
  listPriceCents: number;
  conditionPriceCents: number;
  floorPriceCents: number;
  maxInstantDiscountBps: number;
  groupCount: number;
  tierOneCount: number;
  tierOneDiscountBps: number;
  tierTwoCount: number;
  tierTwoDiscountBps: number;
  activeBargain?: { id: string; priceCents: number } | null;
};

export type PriceOption = {
  source: "condition" | "group" | "bargain";
  label: string;
  priceCents: number;
  available: boolean;
  detail: string;
};

export type NegotiationResult = {
  offeredPriceCents: number;
  status: "accepted" | "countered";
  priceSource: PriceOption["source"] | "negotiated";
  sourceBargainId?: string;
  rationale: string;
  options: PriceOption[];
};

export function discountedPrice(priceCents: number, discountBps: number) {
  return Math.round((priceCents * (10_000 - discountBps)) / 10_000);
}

export function getGroupTier(input: PricingInput) {
  if (input.groupCount >= input.tierTwoCount) {
    return { count: input.tierTwoCount, discountBps: input.tierTwoDiscountBps };
  }
  if (input.groupCount >= input.tierOneCount) {
    return { count: input.tierOneCount, discountBps: input.tierOneDiscountBps };
  }
  return null;
}

export function buildPriceOptions(input: PricingInput): PriceOption[] {
  const tier = getGroupTier(input);
  const nextTier = input.groupCount < input.tierOneCount ? input.tierOneCount : input.tierTwoCount;
  const nextDiscount = input.groupCount < input.tierOneCount
    ? input.tierOneDiscountBps
    : input.tierTwoDiscountBps;

  const options: PriceOption[] = [
    {
      source: "condition",
      label: "Current condition price",
      priceCents: input.conditionPriceCents,
      available: true,
      detail: "Available now with the selected condition and inventory."
    },
    {
      source: "group",
      label: tier ? `Group tier (${tier.count}+ buyers)` : `Next group tier (${nextTier} buyers)`,
      priceCents: discountedPrice(input.conditionPriceCents, tier?.discountBps ?? nextDiscount),
      available: Boolean(tier),
      detail: tier
        ? `${input.groupCount} buyers unlocked this demand-based price.`
        : `${Math.max(0, nextTier - input.groupCount)} more commitment(s) needed to unlock it.`
    }
  ];

  if (input.activeBargain) {
    options.push({
      source: "bargain",
      label: "Limited merchant bargain",
      priceCents: input.activeBargain.priceCents,
      available: true,
      detail: "A live, inventory-limited offer published from aggregate shopper demand."
    });
  }

  return options.sort((a, b) => a.priceCents - b.priceCents);
}

export function negotiatePrice(input: PricingInput, targetPriceCents: number): NegotiationResult {
  const options = buildPriceOptions(input);
  const bestAvailable = options.filter((option) => option.available).sort((a, b) => a.priceCents - b.priceCents)[0];
  const sourceBargainId = bestAvailable.source === "bargain" ? input.activeBargain?.id : undefined;
  const instantPolicyFloor = Math.max(
    input.floorPriceCents,
    discountedPrice(bestAvailable.priceCents, input.maxInstantDiscountBps)
  );

  if (targetPriceCents >= bestAvailable.priceCents) {
    return {
      offeredPriceCents: bestAvailable.priceCents,
      status: "accepted",
      priceSource: bestAvailable.source,
      sourceBargainId,
      rationale: `${bestAvailable.label} already beats the requested target.`,
      options
    };
  }

  if (targetPriceCents >= instantPolicyFloor) {
    return {
      offeredPriceCents: targetPriceCents,
      status: "accepted",
      priceSource: "negotiated",
      sourceBargainId,
      rationale: "The target fits the merchant’s instant-offer guardrails and has been accepted for 10 minutes.",
      options
    };
  }

  return {
    offeredPriceCents: instantPolicyFloor,
    status: "countered",
    priceSource: "negotiated",
    sourceBargainId,
    rationale: "The target falls outside the current instant-offer guardrails; this is the best rule-bound counteroffer.",
    options
  };
}
