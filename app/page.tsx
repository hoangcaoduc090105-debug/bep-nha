"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { CircleHelp, CookingPot, Settings } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RecipeCard, RecipeCardSkeleton } from "@/components/ui/recipe-card";
import { Banner, EmptyState } from "@/components/ui/states";
import { getActiveSession, getRecipeBundle, getSetting, listJournal, listRecipes, setSetting } from "@/data/repo";
import { DEFAULTS, REMIND_AFTER_DAYS } from "@/lib/settings";
import { recipeBadge } from "@/lib/labels";
import { RecipePhoto } from "@/components/recipe-photo";
import { MealSuggestion } from "@/components/meal-suggestion";
import { FamilyPhoto } from "@/components/family-photo";

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
    return { addressAs: await getSetting("addressAs", DEFAULTS.addressAs), overdue, guideSeen: await getSetting("guideSeen", false) };
  }, []);

  return (
    <AppShell tab="home">
      <div className="flex items-center justify-between gap-3">
        <FamilyPhoto className="size-24" />
        <div className="flex shrink-0">
          <Link href="/huong-dan/" className="flex min-h-target flex-col items-center justify-center rounded-md px-3 text-sm font-medium text-accent">
            <CircleHelp aria-hidden className="size-7" />
            Cách dùng
          </Link>
          <Link href="/cai-dat/" className="flex min-h-target flex-col items-center justify-center rounded-md px-3 text-sm font-medium text-accent">
            <Settings aria-hidden className="size-7" />
            Cài đặt
          </Link>
        </div>
      </div>
      <h1 className="text-display">Chào {home?.addressAs ?? DEFAULTS.addressAs}, hôm nay nấu gì ạ?</h1>

      {home && !home.guideSeen && (
        <Banner
          action={
            <span className="flex flex-wrap gap-3">
              <Link href="/huong-dan/" onClick={() => void setSetting("guideSeen", true)} className="inline-flex min-h-target items-center rounded-md bg-accent px-5 text-lg font-semibold text-on-accent">
                Xem cách dùng
              </Link>
              <button type="button" onClick={() => void setSetting("guideSeen", true)} className="inline-flex min-h-target items-center rounded-md border-2 border-border-input bg-surface px-5 text-lg font-semibold">
                Để sau
              </button>
            </span>
          }
        >
          Bếp Nhà có thêm phần hướng dẫn, đọc chừng một phút là dùng được.
        </Banner>
      )}

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

      <MealSuggestion />

      {recent && recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl">Mới nấu gần đây</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {recent.map(({ recipe, version }) => (
              <RecipeCard key={recipe!.id} href={`/cong-thuc/mon/?id=${recipe!.id}`} name={recipe!.name} photo={<RecipePhoto imageId={recipe!.imageId} name={recipe!.name} videoId={recipe!.source.youtubeVideoId} />} totalMinutes={(version?.prepMinutes ?? 0) + (version?.cookMinutes ?? 0)} servings={version?.servings ?? 4} badge={recipeBadge(recipe!)} />
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
        return <RecipeCard key={b.recipe.id} href={`/cong-thuc/mon/?id=${b.recipe.id}`} name={b.recipe.name} photo={<RecipePhoto imageId={b.recipe.imageId} name={b.recipe.name} videoId={b.recipe.source.youtubeVideoId} />} totalMinutes={v.prepMinutes + v.cookMinutes} servings={v.servings} badge={recipeBadge(b.recipe)} />;
      })}
    </div>
  );
}
