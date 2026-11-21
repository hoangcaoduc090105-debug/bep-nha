import type { ButtonHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & { selected?: boolean };

/** A large toggle chip: ingredients at home, categories, reasons for a change. */
export function Chip({ selected = false, className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-12 items-center gap-2 rounded-pill border-2 px-5 text-base font-medium",
        "disabled:cursor-not-allowed disabled:opacity-55",
        selected ? "border-accent bg-accent-soft text-text" : "border-border-input bg-surface text-text",
        className,
      )}
      {...rest}
    >
      {selected && <Check aria-hidden className="size-5 text-accent" />}
      {children}
    </button>
  );
}
