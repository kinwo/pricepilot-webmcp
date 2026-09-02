import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="LightningPricePilot home"
      className={cn("group inline-flex items-center gap-3 text-[var(--navy)]", className)}
    >
      <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[0.9rem] shadow-[0_10px_24px_rgba(19,34,56,0.18)] transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105">
        <Image src="/icon.svg" alt="" width={44} height={44} priority />
      </span>
      {!compact && (
        <span className="font-display flex flex-col items-start leading-none">
          <span className="mb-1 text-[0.58rem] font-black uppercase tracking-[0.24em] text-[var(--coral)]">
            Lightning
          </span>
          <span className="text-xl font-extrabold tracking-[-0.045em]">
            Price<span className="text-[var(--coral)]">Pilot</span>
          </span>
        </span>
      )}
    </Link>
  );
}
