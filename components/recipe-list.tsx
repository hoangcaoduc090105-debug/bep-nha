"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { RecipeCard, RecipeCardSkeleton } from "@/components/ui/recipe-card";
import { getRecipeBundle, listRecipes } from "@/data/repo";
import { recipeBadge } from "@/lib/labels";

/** Recipe cards for a search query or the favourites. `empty` is shown when nothing matches. */
export function RecipeList({ query = "", category, favoritesOnly = false, empty }: { query?: string; category?: string; favoritesOnly?: boolean; empty: React.ReactNode }) {
  const bundles = useLiveQuery(async () => {
    const list = await listRecipes({ query, favoritesOnly, category });
    return Promise.all(list.map((r) => getRecipeBundle(r.id)));
  }, [query, favoritesOnly, category]);
  if (bundles === undefined) return <RecipeCardSkeleton />;
  if (bundles.length === 0) return <>{empty}</>;
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
