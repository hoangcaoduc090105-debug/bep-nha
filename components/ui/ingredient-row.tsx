"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export type IngredientRowProps = {
  name: string;
  /** "1½ muỗng canh" */
  amount: string;
  /** "(khoảng 22 ml)" */
  metric?: string;
  /** "băm nhỏ", "cắt khúc 3 cm" */
  prepNote?: string;
  optional?: boolean;
  /** When given, the row can be ticked off (checklist before cooking, "đã cho" while cooking). */
  checked?: boolean;
  onCheckedChange?: (v: boolean) => void;
};

export function IngredientRow({ name, amount, metric, prepNote, optional, checked, onCheckedChange }: IngredientRowProps) {
  const id = useId();
  const tickable = onCheckedChange != null;
  const body = (
    <>
      {tickable && (
        <span
          aria-hidden
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-sm border-2",
            checked ? "border-secondary bg-secondary text-on-secondary" : "border-border-input bg-surface",
          )}
        >
          {checked && <Check className="size-6" />}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-medium">
          {name}
          {optional && <span className="font-normal text-text-muted"> (nếu có)</span>}
        </span>
        {prepNote && <span className="block text-base text-text-muted">{prepNote}</span>}
      </span>
      <span className="shrink-0 text-right">
        <span className="tabular block text-lg">{amount}</span>
        {metric && <span className="tabular block text-sm text-text-muted">{metric}</span>}
      </span>
    </>
  );
  const cls = cn("flex min-h-target items-center gap-4 rounded-md px-3 py-2", checked && "bg-secondary-soft");
  if (!tickable) return <div className={cls}>{body}</div>;
  return (
    <label htmlFor={id} className={cn(cls, "cursor-pointer has-focus-visible:outline-3 has-focus-visible:outline-accent")}>
      <input id={id} type="checkbox" className="sr-only" checked={checked ?? false} onChange={(e) => onCheckedChange(e.target.checked)} />
      {body}
    </label>
  );
}
