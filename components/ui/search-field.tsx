"use client";

import { useId } from "react";
import { Search, X } from "lucide-react";

export function SearchField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-base font-medium">
        {label}
      </label>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-text-muted" />
        <input
          id={id}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-target w-full rounded-md border-2 border-border-input bg-surface pl-13 pr-24 text-lg placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {value !== "" && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 inline-flex min-h-12 -translate-y-1/2 items-center gap-1 rounded-sm px-3 text-base font-medium text-accent"
          >
            <X aria-hidden className="size-5" /> Xoá
          </button>
        )}
      </div>
    </div>
  );
}
