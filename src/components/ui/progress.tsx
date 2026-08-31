"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ className, value = 0 }: { className?: string; value?: number }) {
  return (
    <ProgressPrimitive.Root className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-[#e7e9e5]", className)} value={value}>
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-[var(--lime)] transition-transform duration-500"
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

