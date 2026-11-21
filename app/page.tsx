"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { CookingPot, Settings } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RecipeCard, RecipeCardSkeleton } from "@/components/ui/recipe-card";
import { Banner, EmptyState } from "@/components/ui/states";
import { getActiveSession, getRecipeBundle, getSetting, listJournal, listRecipes } from "@/data/repo";
import { DEFAULTS, REMIND_AFTER_DAYS } from "@/lib/settings";
import { recipeBadge } from "@/lib/labels";

export default function HomePage() {
  const recipes = useLiveQuery(() => listRecipes(), []);
  const active = useLiveQuery(async () => {
    const s = await getActiveSession();
    if (!s) return null;
    const b = await getRecipeBundle(s.recipeId);
    const total = b?.versions.find((v) => v.id === s.versionId)?.steps.length ?? 0;
    return { session: s, name: b?.recipe.name ?? "", total };
  }, []);
  const recent = useLiveQuery(async () => {
    const seen = new Set<string>();
    return (await listJournal()).filter((e) => e.recipe && !e.recipe.isArchived && !seen.has(e.recipe.id) && seen.add(e.recipe.id)).slice(0, 4);
  }, []);

  const home = useLiveQuery(async () => {
    const unsavedSince = await getSetting<string | null>("unsavedSince", null);
    const overdue = unsavedSince != null && Date.now() - new Date(unsavedSince).getTime() > REMIND_AFTER_DAYS * 86_400_000;
    return { addressAs: await getSetting("addressAs", DEFAULTS.addressAs), overdue };
  }, []);

  return (
    <AppShell tab="home">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-display">Chào {home?.addressAs ?? DEFAULTS.addressAs}, hôm nay nấu gì ạ?</h1>
        <Link href="/cai-dat/" className="flex min-h-target shrink-0 flex-col items-center justify-center rounded-md px-2 text-sm font-medium text-accent">
          <Settings aria-hidden className="size-7" />
          Cài đặt
        </Link>
      </div>

      {home?.overdue && (
        <Banner
          kind="backup"
          action={
            <Link href="/cai-dat/" className="inline-flex min-h-target items-center rounded-md border-2 border-border-input bg-surface px-5 text-lg font-semibold">
              Sao lưu
            </Link>
          }
        >
          Có thay đổi hơn {REMIND_AFTER_DAYS} ngày chưa sao lưu.
        </Banner>
      )}

      {active && (
        <Link href="/dang-nau/" className="flex items-center gap-4 rounded-lg bg-accent p-4 text-on-accent shadow-card">
          <CookingPot aria-hidden className="size-10 shrink-0" />
          <span className="flex-1">
            <span className="block text-lg">Đang nấu dở: {active.name}</span>
            <span className="block text-base">
              {active.session.currentStep === 0 ? "Đang chuẩn bị nguyên liệu" : `Bước ${Math.min(active.session.currentStep, active.total)} / ${active.total}`} — bấm để nấu tiếp
            </span>
          </span>
        </Link>
      )}

      {recent && recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl">Mới nấu gần đây</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {recent.map(({ recipe, version }) => (
              <RecipeCard key={recipe!.id} href={`/cong-thuc/mon/?id=${recipe!.id}`} name={recipe!.name} totalMinutes={(version?.prepMinutes ?? 0) + (version?.cookMinutes ?? 0)} servings={version?.servings ?? 4} badge={recipeBadge(recipe!)} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Công thức của nhà mình</h2>
        {recipes === undefined ? (
          <RecipeCardSkeleton />
        ) : recipes.length === 0 ? (
          <EmptyState title="Chưa có công thức nào" />
        ) : (
          <RecipeGrid ids={recipes.map((r) => r.id)} />
        )}
      </section>
    </AppShell>
  );
}

function RecipeGrid({ ids }: { ids: string[] }) {
  const bundles = useLiveQuery(() => Promise.all(ids.map((id) => getRecipeBundle(id))), [ids.join(",")]);
  if (!bundles) return <RecipeCardSkeleton />;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {bundles.map((b) => {
        if (!b) return null;
        const v = b.family ?? b.original;
        return <RecipeCard key={b.recipe.id} href={`/cong-thuc/mon/?id=${b.recipe.id}`} name={b.recipe.name} totalMinutes={v.prepMinutes + v.cookMinutes} servings={v.servings} badge={recipeBadge(b.recipe)} />;
      })}
    </div>
  );
}
