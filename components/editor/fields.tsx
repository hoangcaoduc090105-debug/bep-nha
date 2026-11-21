"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const INPUT = "min-h-target w-full rounded-md border-2 border-border-input bg-surface px-4 text-lg placeholder:text-text-muted";

type Common = { label: string; hint?: ReactNode; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; className?: string };

export function TextField({ label, hint, value, onChange, placeholder, maxLength = 200, className, inputMode, type = "text" }: Common & { inputMode?: "text" | "url" | "numeric"; type?: "text" | "url" }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <input id={id} type={type} inputMode={inputMode} autoComplete="off" value={value} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} className={INPUT} />
      {hint && <p className="text-text-muted">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, hint, value, onChange, placeholder, maxLength = 2000, className, rows = 3, textareaRef }: Common & { rows?: number; textareaRef?: React.Ref<HTMLTextAreaElement> }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <textarea id={id} ref={textareaRef} rows={rows} value={value} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} className={cn(INPUT, "py-3 leading-relaxed")} />
      {hint && <p className="text-text-muted">{hint}</p>}
    </div>
  );
}

export function Card({ title, children, actions }: { title: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );
}
