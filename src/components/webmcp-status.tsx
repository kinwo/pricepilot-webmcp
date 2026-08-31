"use client";

import { useState } from "react";
import { FiCheck, FiCopy, FiCpu, FiTool } from "react-icons/fi";
import type { Role } from "@/lib/contracts";
import type { WebMCPStatus as Status } from "./webmcp-provider";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

export function WebMCPStatus({
  status,
  tools,
  role,
  roomCode,
  error
}: {
  status: Status;
  tools: string[];
  role: Role;
  roomCode: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const prompt = role === "shopper"
    ? "Find me a lightweight refurbished laptop under $900. Compare every available price path, negotiate toward $800 if sensible, and ask before joining a group or checking out."
    : "Review aggregate demand in this room. Find the strongest opportunity, then propose a limited bargain that would notify interested shoppers. Ask before publishing it.";
  const supported = status === "ready";

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--navy)] transition hover:border-[var(--navy)]"
      >
        <span className={`h-2 w-2 rounded-full ${supported ? "live-dot bg-[var(--teal)]" : status === "error" ? "bg-[var(--coral)]" : "bg-[#a6adb5]"}`} />
        {supported ? `${tools.length} WebMCP tools` : status === "unsupported" ? "WebMCP unavailable" : "Checking WebMCP"}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3"><FiCpu /> WebMCP agent surface</DialogTitle>
            <DialogDescription>
              This {role} page registers only the tools appropriate to its role. Room {roomCode} is already bound into each tool call.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white p-4">
            <span className={`h-3 w-3 rounded-full ${supported ? "bg-[var(--teal)]" : "bg-[#a6adb5]"}`} />
            <div className="flex-1"><p className="text-sm font-bold">{supported ? "Connected and discoverable" : "Visual interface remains available"}</p><p className="text-xs text-[var(--muted)]">{error || (supported ? "ChatGPT can call the tools listed below." : "Open this page in a browser with WebMCP support.")}</p></div>
            <Badge variant={supported ? "teal" : "neutral"}>{status}</Badge>
          </div>
          <div className="mt-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]"><FiTool /> Registered tools</p>
            <div className="flex flex-wrap gap-2">
              {tools.map((tool) => <code key={tool} className="rounded-lg bg-[#eef0ec] px-2.5 py-1.5 text-xs font-semibold text-[var(--navy)]">{tool}</code>)}
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-[var(--navy)] p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--lime)]">Suggested ChatGPT prompt</p>
            <p className="mt-3 text-sm leading-6 text-white/85">{prompt}</p>
            <Button variant="lime" size="sm" className="mt-4" onClick={copyPrompt}>{copied ? <FiCheck /> : <FiCopy />}{copied ? "Copied" : "Copy prompt"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

