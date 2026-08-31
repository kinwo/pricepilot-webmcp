import { describe, expect, it } from "vitest";
import { merchantToolDefinitions, shopperToolDefinitions } from "@/lib/webmcp-tools";

const tools = [...shopperToolDefinitions, ...merchantToolDefinitions];

describe("WebMCP tool surface", () => {
  it("uses unique, concise tool names and descriptions", () => {
    expect(new Set(tools.map((tool) => tool.name)).size).toBe(tools.length);
    for (const tool of tools) {
      expect(tool.name.length).toBeLessThanOrEqual(30);
      expect(tool.description.length).toBeLessThanOrEqual(500);
      expect(tool.inputSchema).toMatchObject({ type: "object" });
      const properties = (tool.inputSchema.properties ?? {}) as Record<string, { description?: string }>;
      for (const property of Object.values(properties)) {
        expect(property.description?.length ?? 0).toBeLessThanOrEqual(150);
      }
    }
  });

  it("marks read actions and protects commitments with approval copy", () => {
    expect(shopperToolDefinitions.find((tool) => tool.name === "search_products")?.readOnly).toBe(true);
    expect(shopperToolDefinitions.find((tool) => tool.name === "prepare_mock_checkout")?.approval).toBeTruthy();
    expect(merchantToolDefinitions.find((tool) => tool.name === "publish_bargain")?.approval).toBeTruthy();
  });

  it("marks merchant-authored outputs as untrusted", () => {
    expect(shopperToolDefinitions.find((tool) => tool.name === "get_notifications")?.untrustedContent).toBe(true);
    expect(merchantToolDefinitions.find((tool) => tool.name === "publish_bargain")?.untrustedContent).toBe(true);
  });
});
