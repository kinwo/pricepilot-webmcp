"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

export type ApprovalRequest = {
  title: string;
  description: string;
  confirmLabel?: string;
};

type PendingApproval = ApprovalRequest & { resolve: (approved: boolean) => void };

const ApprovalContext = createContext<((request: ApprovalRequest) => Promise<boolean>) | null>(null);

export function ApprovalProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingApproval | null>(null);
  const pendingRef = useRef<PendingApproval | null>(null);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => () => pendingRef.current?.resolve(false), []);

  const requestApproval = useCallback((request: ApprovalRequest) => {
    return new Promise<boolean>((resolve) => {
      setPending((current) => {
        current?.resolve(false);
        return { ...request, resolve };
      });
    });
  }, []);

  function finish(approved: boolean) {
    setPending((current) => {
      current?.resolve(approved);
      return null;
    });
  }

  return (
    <ApprovalContext.Provider value={requestApproval}>
      {children}
      <Dialog open={Boolean(pending)} onOpenChange={(open) => !open && finish(false)}>
        <DialogContent onEscapeKeyDown={() => finish(false)}>
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#e2f8f2] text-xl text-[var(--teal)]">
            <FiCheckCircle aria-hidden="true" />
          </div>
          <DialogHeader>
            <DialogTitle>{pending?.title}</DialogTitle>
            <DialogDescription>{pending?.description}</DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-4 text-xs leading-5 text-[var(--muted)]">
            You stay in control. PricePilot will wait here until you approve or cancel this action.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => finish(false)}>Cancel</Button>
            <Button variant="coral" onClick={() => finish(true)}>{pending?.confirmLabel ?? "Approve"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ApprovalContext.Provider>
  );
}

export function useApproval() {
  const context = useContext(ApprovalContext);
  if (!context) throw new Error("useApproval must be used inside ApprovalProvider");
  return context;
}

