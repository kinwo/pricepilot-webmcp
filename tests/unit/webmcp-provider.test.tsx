// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApprovalProvider } from "@/components/approval-provider";
import { useWebMCP } from "@/components/webmcp-provider";

type RegisteredTool = {
  name: string;
  annotations?: { readOnlyHint?: boolean };
  execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<unknown>;
};

function Harness() {
  useWebMCP("ABC234", "shopper");
  return null;
}

afterEach(() => {
  vi.restoreAllMocks();
  delete document.modelContext;
});

describe("WebMCP registration lifecycle", () => {
  it("registers role tools, forwards cancellation, and unregisters on cleanup", async () => {
    const tools: RegisteredTool[] = [];
    const registrationSignals: AbortSignal[] = [];
    document.modelContext = {
      registerTool: vi.fn(async (tool, options) => {
        tools.push(tool as RegisteredTool);
        if (options?.signal) registrationSignals.push(options.signal);
      })
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true, summary: "done" }), {
        headers: { "Content-Type": "application/json" }
      })
    );

    const view = render(<ApprovalProvider><Harness /></ApprovalProvider>);
    await waitFor(() => expect(tools).toHaveLength(7));
    expect(tools.find((tool) => tool.name === "search_products")?.annotations?.readOnlyHint).toBe(true);

    const execution = new AbortController();
    await tools.find((tool) => tool.name === "search_products")!.execute({}, { signal: execution.signal });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/rooms/ABC234/actions",
      expect.objectContaining({ signal: execution.signal })
    );

    view.unmount();
    expect(registrationSignals.every((signal) => signal.aborted)).toBe(true);
  });

  it("waits for visible human approval before a commitment", async () => {
    const tools: RegisteredTool[] = [];
    document.modelContext = {
      registerTool: vi.fn(async (tool) => {
        tools.push(tool as RegisteredTool);
      })
    };
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(<ApprovalProvider><Harness /></ApprovalProvider>);
    await waitFor(() => expect(tools).toHaveLength(7));

    const resultPromise = tools
      .find((tool) => tool.name === "join_group_buy")!
      .execute({ productId: "aster-air-13" }, { signal: new AbortController().signal });
    expect(await screen.findByRole("heading", { name: "Join this group buy?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    const result = JSON.parse(String(await resultPromise)) as { ok: boolean };
    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
