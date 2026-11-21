"use client";

import { cn } from "@/lib/cn";

export const FEEDBACK_OPTIONS = [
  { id: "rat_ngon", label: "Rất ngon" },
  { id: "vua_mieng", label: "Vừa miệng" },
  { id: "hoi_man", label: "Hơi mặn" },
  { id: "hoi_ngot", label: "Hơi ngọt" },
  { id: "chua_ngon", label: "Chưa ngon như mong muốn" },
] as const;

export type FeedbackId = (typeof FEEDBACK_OPTIONS)[number]["id"];

export function FeedbackOptions({ value, onChange }: { value: FeedbackId | null; onChange: (v: FeedbackId) => void }) {
  return (
    <div role="radiogroup" aria-label="Gia đình mình thấy món ăn hôm nay thế nào?" className="flex flex-col gap-3">
      {FEEDBACK_OPTIONS.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={cn(
              "flex min-h-target-lg items-center gap-4 rounded-md border-2 px-5 text-left text-lg",
              on ? "border-accent bg-accent-soft" : "border-border-input bg-surface",
            )}
          >
            <span aria-hidden className={cn("flex size-7 shrink-0 items-center justify-center rounded-pill border-2", on ? "border-accent" : "border-border-input")}>
              {on && <span className="size-3.5 rounded-pill bg-accent" />}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
