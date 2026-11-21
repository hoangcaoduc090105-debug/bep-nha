"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatAmount } from "@/lib/quantity";

export type QuantityStepperProps = {
  /** What is being changed, used in the button labels: "nước mắm", "số người ăn". */
  name: string;
  value: number;
  unit: string | null;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  /** Shown small underneath so the original amount is never forgotten. */
  original?: number;
};

const round = (n: number) => Math.round(n * 100) / 100;

export function QuantityStepper({ name, value, unit, step, min, max, onChange, original }: QuantityStepperProps) {
  const changed = original != null && Math.abs(original - value) > 1e-6;
  const btn =
    "flex size-(--spacing-target) shrink-0 items-center justify-center rounded-md border-2 border-border-input bg-surface text-text active:bg-surface-warm disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className={cn("flex items-center gap-3 rounded-md p-2", changed && "bg-accent-soft")}>
      <button type="button" className={btn} aria-label={`Bớt ${name}`} disabled={value - step < min - 1e-6} onClick={() => onChange(round(Math.max(min, value - step)))}>
        <Minus aria-hidden className="size-7" />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <p aria-live="polite" className="tabular text-xl">
          {formatAmount(value, unit)}
        </p>
        {original != null && <p className="text-sm text-text-muted">Bản gốc: {formatAmount(original, unit)}</p>}
      </div>
      <button type="button" className={btn} aria-label={`Thêm ${name}`} disabled={value + step > max + 1e-6} onClick={() => onChange(round(Math.min(max, value + step)))}>
        <Plus aria-hidden className="size-7" />
      </button>
    </div>
  );
}
