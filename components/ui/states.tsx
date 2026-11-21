import type { ReactNode } from "react";
import { CircleAlert, CloudOff, Info, Save } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

type BannerKind = "info" | "offline" | "backup" | "error";

const BANNERS: Record<BannerKind, { cls: string; Icon: typeof Info }> = {
  info: { cls: "bg-surface-warm", Icon: Info },
  offline: { cls: "bg-warning-bg", Icon: CloudOff },
  backup: { cls: "bg-surface-warm", Icon: Save },
  error: { cls: "bg-surface border-2 border-danger", Icon: CircleAlert },
};

export function Banner({ kind = "info", children, action }: { kind?: BannerKind; children: ReactNode; action?: ReactNode }) {
  const { cls, Icon } = BANNERS[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={cn("flex flex-wrap items-center gap-3 rounded-md p-4 text-base", cls)}>
      <Icon aria-hidden className={cn("size-7 shrink-0", kind === "error" && "text-danger")} />
      <p className="min-w-0 flex-1">{children}</p>
      {action}
    </div>
  );
}

/** One sentence and one thing to do. */
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-border bg-surface p-8 text-center">
      <p className="text-lg">{title}</p>
      {children && <p className="text-base text-text-muted">{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-lg border-2 border-danger bg-surface p-8 text-center">
      <CircleAlert aria-hidden className="size-10 text-danger" />
      <p className="text-lg font-normal">{children}</p>
      <Button variant="secondary" onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-sm bg-surface-warm", className)} />;
}
