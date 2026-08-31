"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiCheck, FiCopy, FiRefreshCw, FiShoppingBag, FiTrendingUp, FiUsers } from "react-icons/fi";
import type { Role, ToolResult } from "@/lib/contracts";
import type { RoomSnapshot } from "@/lib/view-types";
import { Brand } from "./brand";
import { ApprovalProvider, useApproval, type ApprovalRequest } from "./approval-provider";
import { MerchantDashboard } from "./merchant-dashboard";
import { ShopperDashboard } from "./shopper-dashboard";
import { WebMCPStatus } from "./webmcp-status";
import { useWebMCP } from "./webmcp-provider";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export type RunAction = (action: string, input?: Record<string, unknown>) => Promise<ToolResult>;
export type ConfirmAction = (
  action: string,
  input: Record<string, unknown>,
  approval: ApprovalRequest
) => Promise<ToolResult>;

export function RoomApp({ roomCode, role }: { roomCode: string; role: Role }) {
  return (
    <ApprovalProvider>
      <RoomAppInner roomCode={roomCode.toUpperCase()} role={role} />
    </ApprovalProvider>
  );
}

function RoomAppInner({ roomCode, role }: { roomCode: string; role: Role }) {
  const requestApproval = useApproval();
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const latestEventId = useRef(0);
  const webmcp = useWebMCP(roomCode, role);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch(`/api/rooms/${roomCode}/snapshot?role=${role}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load the demo room.");
      const nextSnapshot = data.snapshot as RoomSnapshot;
      latestEventId.current = Math.max(latestEventId.current, nextSnapshot.latestEventId);
      setSnapshot(nextSnapshot);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load the demo room.");
    } finally {
      setLoading(false);
    }
  }, [role, roomCode]);

  useEffect(() => {
    // The initial state is already loading; the first state update occurs after fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh(true);
  }, [refresh]);

  const snapshotReady = Boolean(snapshot);
  useEffect(() => {
    if (!snapshotReady) return;
    const source = new EventSource(`/api/rooms/${roomCode}/events?after=${latestEventId.current}`);
    const handleEvent = (rawEvent: Event) => {
      const message = rawEvent as MessageEvent<string>;
      try {
        const event = JSON.parse(message.data) as { id: number; type: string };
        latestEventId.current = Math.max(latestEventId.current, event.id);
        setNotice(event.type === "bargain.published" ? "A new bargain was published and matching shoppers were notified." : "The shared room changed in real time.");
        void refresh(true);
      } catch {
        // Ignore malformed or keepalive events.
      }
    };
    source.addEventListener("room-event", handleEvent);
    return () => source.close();
  }, [refresh, roomCode, snapshotReady]);

  useEffect(() => {
    const handleToolAction = (rawEvent: Event) => {
      const event = rawEvent as CustomEvent<{ action: string; result: ToolResult }>;
      setNotice(`ChatGPT ran ${event.detail.action}: ${event.detail.result.summary}`);
      void refresh(true);
    };
    window.addEventListener("pricepilot:action", handleToolAction);
    return () => window.removeEventListener("pricepilot:action", handleToolAction);
  }, [refresh]);

  const runAction = useCallback<RunAction>(async (action, input = {}) => {
    const response = await fetch(`/api/rooms/${roomCode}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, action, input })
    });
    const result = await response.json() as ToolResult & { error?: string };
    if (!response.ok) {
      throw new Error(result.error ?? result.summary ?? "Action failed.");
    }
    setNotice(result.summary);
    await refresh(true);
    return result;
  }, [refresh, role, roomCode]);

  const confirmAction = useCallback<ConfirmAction>(async (action, input, approval) => {
    const approved = await requestApproval(approval);
    if (!approved) return { ok: false, summary: "Action cancelled by the human." };
    return runAction(action, input);
  }, [requestApproval, runAction]);

  async function reset() {
    const approved = await requestApproval({
      title: "Reset this demo room?",
      description: "Offers, subscriptions, bargains, and mock orders will be cleared. The seeded catalog and four-person showcase group will be restored.",
      confirmLabel: "Reset room"
    });
    if (!approved) return;
    const response = await fetch(`/api/rooms/${roomCode}/reset`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not reset the room.");
      return;
    }
    setNotice("The deterministic demo state has been restored.");
    await refresh(true);
  }

  async function copyCode() {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  if (loading && !snapshot) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="text-center"><span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-[var(--line)] border-t-[var(--coral)]" /><p className="mt-4 font-semibold">Waking the shared market…</p><p className="mt-1 text-sm text-[var(--muted)]">Neon may need a moment after inactivity.</p></div>
      </main>
    );
  }

  if (error || !snapshot) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <Card className="max-w-md p-7 text-center"><h1 className="font-display text-2xl font-black">This room could not be opened</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{error || "The room does not exist."}</p><Link href="/" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[var(--navy)] px-5 text-sm font-semibold text-white">Create a fresh room</Link></Card>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(246,243,234,0.88)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 sm:px-6">
          <Brand />
          <div className="mx-auto hidden rounded-full bg-white p-1 shadow-sm sm:flex">
            <Link href={`/room/${roomCode}/shopper`} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${role === "shopper" ? "bg-[var(--navy)] text-white" : "text-[var(--muted)] hover:text-[var(--navy)]"}`}><FiShoppingBag /> Shopper</Link>
            <Link href={`/room/${roomCode}/merchant`} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${role === "merchant" ? "bg-[var(--navy)] text-white" : "text-[var(--muted)] hover:text-[var(--navy)]"}`}><FiTrendingUp /> Merchant</Link>
          </div>
          <button onClick={copyCode} className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold sm:inline-flex" title="Copy room code">
            <FiUsers className="text-[var(--teal)]" /> {roomCode} {copied ? <FiCheck /> : <FiCopy />}
          </button>
          <WebMCPStatus {...webmcp} role={role} roomCode={roomCode} />
          <Button variant="ghost" size="icon" onClick={reset} title="Reset demo room"><FiRefreshCw /></Button>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-2 sm:hidden">
          <div className="flex gap-1"><Link href={`/room/${roomCode}/shopper`} className={`rounded-full px-3 py-1.5 text-xs font-bold ${role === "shopper" ? "bg-[var(--navy)] text-white" : ""}`}>Shopper</Link><Link href={`/room/${roomCode}/merchant`} className={`rounded-full px-3 py-1.5 text-xs font-bold ${role === "merchant" ? "bg-[var(--navy)] text-white" : ""}`}>Merchant</Link></div>
          <Badge variant="teal">Room {roomCode}</Badge>
        </div>
      </header>

      {notice && (
        <div className="mx-auto mt-4 flex max-w-[1450px] items-start justify-between gap-4 rounded-2xl border border-[#c9e9e1] bg-[#e9faf6] px-4 py-3 text-sm text-[#1b5f52] sm:px-6" role="status">
          <span className="flex items-start gap-2"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--teal)]" />{notice}</span>
          <button onClick={() => setNotice("")} className="text-xs font-bold">Dismiss</button>
        </div>
      )}

      {role === "shopper" ? (
        <ShopperDashboard snapshot={snapshot} runAction={runAction} confirmAction={confirmAction} />
      ) : (
        <MerchantDashboard snapshot={snapshot} runAction={runAction} confirmAction={confirmAction} />
      )}
    </div>
  );
}
