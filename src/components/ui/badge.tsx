import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "coral" | "lime" | "teal" | "navy";

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const variants: Record<BadgeVariant, string> = {
    neutral: "bg-[#eef0ec] text-[#4b5560]",
    coral: "bg-[#ffe1dc] text-[#8c3026]",
    lime: "bg-[#ecffc3] text-[#405d0d]",
    teal: "bg-[#d9f6ef] text-[#176151]",
    navy: "bg-[var(--navy)] text-white"
  };
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]", variants[variant], className)}
      {...props}
    />
  );
}

