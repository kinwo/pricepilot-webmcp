import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 text-sm text-[var(--navy)] outline-none transition placeholder:text-[#8a939e] focus:border-[var(--navy)] focus:ring-2 focus:ring-[rgba(19,34,56,0.08)] disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full resize-none rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 text-sm text-[var(--navy)] outline-none transition placeholder:text-[#8a939e] focus:border-[var(--navy)] focus:ring-2 focus:ring-[rgba(19,34,56,0.08)]",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

