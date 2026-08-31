import { describe, expect, it } from "vitest";
import { actionInputSchemas, roomCodeSchema } from "@/lib/contracts";

describe("room and action contracts", () => {
  it("normalizes valid room codes and rejects ambiguous characters", () => {
    expect(roomCodeSchema.parse("ab23xy")).toBe("AB23XY");
    expect(() => roomCodeSchema.parse("ROOM01")).toThrow();
  });

  it("rejects negative, floating, and implausible prices", () => {
    expect(() => actionInputSchemas.request_offer.parse({ productId: "p1", targetPriceCents: -1 })).toThrow();
    expect(() => actionInputSchemas.request_offer.parse({ productId: "p1", targetPriceCents: 50_000.5 })).toThrow();
    expect(() => actionInputSchemas.request_offer.parse({ productId: "p1", targetPriceCents: 9_999 })).toThrow();
  });

  it("caps merchant-authored text and discount guardrails", () => {
    expect(() => actionInputSchemas.publish_bargain.parse({
      productId: "p1",
      condition: "excellent",
      priceCents: 50_000,
      inventory: 2,
      message: "x".repeat(241)
    })).toThrow();
    expect(() => actionInputSchemas.set_pricing_policy.parse({
      productId: "p1",
      floorPriceCents: 50_000,
      maxInstantDiscountPercent: 26
    })).toThrow();
  });
});

