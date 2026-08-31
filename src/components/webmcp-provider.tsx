"use client";

import { useEffect, useMemo, useState } from "react";
import type { Role, ToolResult } from "@/lib/contracts";
import { getToolDefinitions } from "@/lib/webmcp-tools";
import { useApproval } from "./approval-provider";

export type WebMCPStatus = "checking" | "unsupported" | "registering" | "ready" | "error";

export function useWebMCP(roomCode: string, role: Role) {
  const requestApproval = useApproval();
  const [status, setStatus] = useState<WebMCPStatus>("checking");
  const [error, setError] = useState<string>("");
  const definitions = useMemo(() => getToolDefinitions(role), [role]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function register() {
      if (!document.modelContext?.registerTool) {
        setStatus("unsupported");
        return;
      }
      setStatus("registering");
      try {
        await Promise.all(
          definitions.map((definition) =>
            document.modelContext!.registerTool(
              {
                name: definition.name,
                title: definition.title,
                description: definition.description,
                inputSchema: definition.inputSchema,
                annotations: {
                  readOnlyHint: definition.readOnly,
                  untrustedContentHint: Boolean(definition.untrustedContent)
                },
                execute: async (input, options) => {
                  if (definition.approval) {
                    const approved = await requestApproval(definition.approval);
                    if (!approved) {
                      return JSON.stringify({
                        ok: false,
                        summary: "The human cancelled this action.",
                        nextActions: ["Ask before trying a different commitment."]
                      });
                    }
                  }
                  const response = await fetch(`/api/rooms/${roomCode}/actions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ role, action: definition.name, input }),
                    signal: options.signal
                  });
                  const result = (await response.json()) as ToolResult & { error?: string };
                  if (!response.ok) {
                    result.ok = false;
                    result.summary = result.error ?? result.summary ?? "The PricePilot action failed.";
                  }
                  window.dispatchEvent(
                    new CustomEvent("pricepilot:action", {
                      detail: { action: definition.name, result }
                    })
                  );
                  return JSON.stringify(result);
                }
              },
              { signal: controller.signal }
            )
          )
        );
        if (active) setStatus("ready");
      } catch (caught) {
        if (!controller.signal.aborted && active) {
          setStatus("error");
          setError(caught instanceof Error ? caught.message : "WebMCP registration failed.");
        }
      }
    }

    void register();
    return () => {
      active = false;
      controller.abort();
    };
  }, [definitions, requestApproval, role, roomCode]);

  return { status, error, tools: definitions.map((definition) => definition.name) };
}

