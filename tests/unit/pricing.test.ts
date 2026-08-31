import { describe, expect, it } from "vitest";
import { buildPriceOptions, discountedPrice, negotiatePrice, type PricingInput } from "@/lib/pricing";

const base: PricingInput = {
  listPriceCents: 109_900,
  conditionPriceCents: 87_900,
  floorPriceCents: 73_500,
  maxInstantDiscountBps: 500,
  groupCount: 4,
  tierOneCount: 5,
  tierOneDiscountBps: 800,
  tierTwoCount: 10,
  tierTwoDiscountBps: 1200,
  activeBargain: null
};

describe("price paths", () => {
  it("shows the next group price without making it available before the threshold", () => {
    const group = buildPriceOptions(base).find((option) => option.source === "group");
    expect(group).toMatchObject({ available: false, priceCents: 80_868 });
  });

  it("unlocks eight percent at five buyers and twelve percent at ten", () => {
    const five = buildPriceOptions({ ...base, groupCount: 5 }).find((option) => option.source === "group");
    const ten = buildPriceOptions({ ...base, groupCount: 10 }).find((option) => option.source === "group");
    expect(five).toMatchObject({ available: true, priceCents: discountedPrice(87_900, 800) });
    expect(ten).toMatchObject({ available: true, priceCents: discountedPrice(87_900, 1200) });
  });

  it("selects a live bargain when it already beats the target", () => {
    const result = negotiatePrice({ ...base, activeBargain: { id: "deal-1", priceCents: 77_900 } }, 80_000);
    expect(result).toMatchObject({
      status: "accepted",
      offeredPriceCents: 77_900,
      priceSource: "bargain",
      sourceBargainId: "deal-1"
    });
  });

  it("reserves bargain inventory when negotiating from a bargain price", () => {
    const result = negotiatePrice(
      { ...base, activeBargain: { id: "deal-2", priceCents: 80_000 } },
      77_000
    );
    expect(result.priceSource).toBe("negotiated");
    expect(result.sourceBargainId).toBe("deal-2");
  });
});

describe("rule-bound negotiation", () => {
  it("accepts a target inside the instant policy range", () => {
    const result = negotiatePrice(base, 84_000);
    expect(result.status).toBe("accepted");
    expect(result.offeredPriceCents).toBe(84_000);
    expect(result.priceSource).toBe("negotiated");
  });

  it("counters below-policy targets without crossing the private floor", () => {
    const result = negotiatePrice(base, 60_000);
    expect(result.status).toBe("countered");
    expect(result.offeredPriceCents).toBe(83_505);
    expect(result.offeredPriceCents).toBeGreaterThanOrEqual(base.floorPriceCents);
    expect(result.rationale.toLowerCase()).not.toContain("735");
  });

  it("uses integer cents for every calculation", () => {
    expect(Number.isInteger(discountedPrice(99_999, 1_234))).toBe(true);
  });
});
