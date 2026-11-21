import Link from "next/link";
import { BookOpen, CookingPot, Heart, House, NotebookPen } from "lucide-react";
import { cn } from "@/lib/cn";

export const TABS = [
  { id: "home", href: "/", label: "Trang chủ", Icon: House },
  { id: "recipes", href: "/cong-thuc", label: "Công thức", Icon: BookOpen },
  { id: "cooking", href: "/dang-nau", label: "Đang nấu", Icon: CookingPot },
  { id: "journal", href: "/nhat-ky", label: "Nhật ký", Icon: NotebookPen },
  { id: "favorites", href: "/yeu-thich", label: "Yêu thích", Icon: Heart },
] as const;

export type TabId = (typeof TABS)[number]["id"];

/**
 * Label size follows the screen width (capped at 1rem) so five labels fit a 360px phone at
 * every text-size setting — the one place where text does not scale with the rem setting.
 * Five tabs, icon and label always shown. `cookingStep` shows a badge while a dish is being cooked. */
export function TabBar({ current, cookingStep, className }: { current: TabId; cookingStep?: number; className?: string }) {
  return (
    <nav aria-label="Điều hướng chính" className={cn("border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]", className)}>
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {TABS.map(({ id, href, label, Icon }) => {
          const active = id === current;
          return (
            <li key={id}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-18 flex-col items-center justify-center gap-1 text-[min(3.6vw,1rem)] leading-tight",
                  active ? "font-bold text-accent" : "font-medium text-text-muted",
                )}
              >
                {active && <span aria-hidden className="absolute inset-x-3 top-0 h-1 rounded-b-sm bg-accent" />}
                <span className="relative">
                  <Icon aria-hidden className="size-7" />
                  {id === "cooking" && cookingStep != null && (
                    <span className="absolute -right-3 -top-1 flex size-5 items-center justify-center rounded-pill bg-accent text-xs font-bold text-on-accent">
                      <span className="sr-only">Đang ở bước </span>
                      {cookingStep}
                    </span>
                  )}
                </span>
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
