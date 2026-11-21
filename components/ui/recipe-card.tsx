import type { ReactNode } from "react";
import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { PhotoTile } from "./photo-tile";
import { VersionBadge, type BadgeKind } from "./version";

export type RecipeCardProps = {
  href: string;
  name: string;
  imageUrl?: string | null;
  /** The photo, when the caller loads it itself (a photo stored on the device). */
  photo?: ReactNode;
  totalMinutes: number;
  servings: number;
  badge?: BadgeKind;
};

export function RecipeCard({ href, name, imageUrl, photo, totalMinutes, servings, badge }: RecipeCardProps) {
  return (
    <Link href={href} className="block rounded-lg border border-border bg-surface p-3 shadow-card active:bg-surface-warm">
      {photo ?? <PhotoTile src={imageUrl} name={name} />}
      <div className="mt-3 flex flex-col gap-2 px-1 pb-1">
        <h3 className="text-lg">{name}</h3>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden className="size-5" /> {totalMinutes} phút
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users aria-hidden className="size-5" /> {servings} người
          </span>
        </p>
        {badge && <VersionBadge kind={badge} className="self-start" />}
      </div>
    </Link>
  );
}

export function RecipeCardSkeleton() {
  return (
    <div aria-hidden className="rounded-lg border border-border bg-surface p-3">
      <div className="aspect-4/3 w-full animate-pulse rounded-md bg-surface-warm" />
      <div className="mt-3 h-7 w-2/3 animate-pulse rounded-sm bg-surface-warm" />
      <div className="mt-2 h-6 w-1/2 animate-pulse rounded-sm bg-surface-warm" />
    </div>
  );
}
