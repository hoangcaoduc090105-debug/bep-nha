import { cn } from "@/lib/cn";

export type BadgeKind = "family" | "original" | "sample" | "entered" | "video" | "approved";

const BADGES: Record<BadgeKind, { label: string; cls: string }> = {
  family: { label: "Bản nhà mình", cls: "bg-accent-soft text-text" },
  original: { label: "Bản gốc", cls: "bg-surface-warm text-text" },
  sample: { label: "Mẫu – chưa kiểm chứng", cls: "bg-warning-bg text-text" },
  entered: { label: "Mới nhập – chưa nấu thử", cls: "bg-warning-bg text-text" },
  video: { label: "Viết lại theo video", cls: "bg-surface-warm text-text" },
  approved: { label: "Gia đình đã duyệt", cls: "bg-secondary-soft text-text" },
};

export function VersionBadge({ kind, className }: { kind: BadgeKind; className?: string }) {
  const b = BADGES[kind];
  return (
    <span className={cn("inline-flex items-center rounded-pill px-3 py-1 text-sm font-medium", b.cls, className)}>
      {b.label}
    </span>
  );
}

/** Two large segments: which version of the recipe is shown. */
export function VersionSwitch({
  value,
  onChange,
  hasFamily = true,
}: {
  value: "family" | "original";
  onChange: (v: "family" | "original") => void;
  hasFamily?: boolean;
}) {
  const options = [
    { id: "family" as const, label: "Bản nhà mình", disabled: !hasFamily },
    { id: "original" as const, label: "Bản gốc", disabled: false },
  ];
  return (
    <div role="radiogroup" aria-label="Chọn phiên bản công thức" className="grid grid-cols-2 gap-2 rounded-md bg-surface-warm p-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          disabled={o.disabled}
          onClick={() => onChange(o.id)}
          className={cn(
            "min-h-target rounded-sm px-3 text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-55",
            value === o.id ? "bg-surface text-accent shadow-card" : "text-text-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
