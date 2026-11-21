"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatAmount, parseAmount } from "@/lib/quantity";

const plain = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * An amount entered two ways: large − and + buttons, or tapping the number and typing it
 * on the number pad ("1,5" and "1/2" both work). The amount is read back in words underneath.
 */
export function AmountInput({ name, value, unit, step, max, onChange }: { name: string; value: number | null; unit: string | null; step: number; max: number; onChange: (v: number | null) => void }) {
  const id = useId();
  // What is being typed; null means "show the stored value".
  const [typing, setTyping] = useState<string | null>(null);
  const shown = typing ?? (value == null ? "" : plain(value));
  const invalid = typing != null && typing.trim() !== "" && parseAmount(typing) == null;
  const press = (next: number) => {
    setTyping(null);
    onChange(round(Math.min(max, Math.max(step, next))));
  };
  const btn = "flex size-(--spacing-target) shrink-0 items-center justify-center rounded-md border-2 border-border-input bg-surface text-text active:bg-surface-warm disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-medium">
        Lượng
      </label>
      <div className="flex items-center gap-3">
        <button type="button" className={btn} aria-label={`Bớt ${name}`} disabled={value == null || value <= step + 1e-6} onClick={() => press((value ?? 0) - step)}>
          <Minus aria-hidden className="size-7" />
        </button>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={shown}
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            setTyping(e.target.value);
            const n = parseAmount(e.target.value);
            onChange(n == null ? null : Math.min(max, n));
          }}
          onBlur={() => setTyping(null)}
          className={cn("tabular min-h-target w-full min-w-0 flex-1 rounded-md border-2 bg-surface px-2 text-center text-xl", invalid ? "border-danger" : "border-border-input")}
        />
        <button type="button" className={btn} aria-label={`Thêm ${name}`} disabled={value != null && value >= max} onClick={() => press((value ?? 0) + step)}>
          <Plus aria-hidden className="size-7" />
        </button>
      </div>
      <p aria-live="polite" className={invalid || value == null ? "text-danger" : "text-text-muted"}>
        {invalid ? "Chưa đọc được số này. Mẹ gõ kiểu 2 hoặc 1,5 hoặc 1/2." : value == null ? "Chưa có lượng." : `Đọc là: ${formatAmount(value, unit)}`}
      </p>
    </div>
  );
}
