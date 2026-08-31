import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--navy)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--navy)] px-5 py-2.5 text-white shadow-[0_8px_20px_rgba(19,34,56,0.16)] hover:-translate-y-0.5 hover:bg-[#1f385a]",
        coral: "bg-[var(--coral)] px-5 py-2.5 text-[var(--navy)] shadow-[0_8px_20px_rgba(255,111,97,0.25)] hover:-translate-y-0.5 hover:bg-[#ff8174]",
        lime: "bg-[var(--lime)] px-5 py-2.5 text-[var(--navy)] hover:-translate-y-0.5 hover:bg-[#d8ff76]",
        outline: "border border-[var(--line)] bg-white/70 px-5 py-2.5 text-[var(--navy)] hover:border-[var(--navy)] hover:bg-white",
        ghost: "px-4 py-2 text-[var(--navy)] hover:bg-black/5",
        danger: "bg-[#ffe0dc] px-5 py-2.5 text-[#8a281f] hover:bg-[#ffc9c2]"
      },
      size: {
        default: "h-11",
        sm: "h-9 px-4 py-2 text-xs",
        lg: "h-13 px-7 py-3 text-base",
        icon: "h-10 w-10 p-0"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

export { buttonVariants };

