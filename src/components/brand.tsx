import Link from "next/link";
import { TbSparkles } from "react-icons/tb";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 text-[var(--navy)]", className)}>
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--navy)] text-lg text-[var(--lime)] shadow-lg">
        <TbSparkles aria-hidden="true" />
      </span>
      {!compact && (
        <span className="font-display text-xl font-extrabold tracking-[-0.04em]">
          Price<span className="text-[var(--coral)]">Pilot</span>
        </span>
      )}
    </Link>
  );
}

