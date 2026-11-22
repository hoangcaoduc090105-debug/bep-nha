"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { RecipePhoto } from "@/components/recipe-photo";
import { RecipeCard, RecipeCardSkeleton } from "@/components/ui/recipe-card";
import { getRecipeBundle, listRecipes } from "@/data/repo";
import { groupByType } from "@/lib/dish-groups";
import { recipeBadge } from "@/lib/labels";

/**
 * Recipe cards for a search query, a kind of dish, a main ingredient or the favourites.
 * With `grouped` the dishes are listed under their kind ("Món mặn", "Món canh"…), each heading
 * with its number of dishes. `empty` is shown when nothing matches.
 */
export function RecipeList({ query = "", category, mainIngredient, favoritesOnly = false, grouped = false, empty }: { query?: string; category?: string; mainIngredient?: string; favoritesOnly?: boolean; grouped?: boolean; empty: React.ReactNode }) {
  const bundles = useLiveQuery(async () => {
    const list = await listRecipes({ query, favoritesOnly, category, mainIngredient });
    return (await Promise.all(list.map((r) => getRecipeBundle(r.id)))).filter((b) => b != null);
  }, [query, favoritesOnly, category, mainIngredient]);
  if (bundles === undefined) return <RecipeCardSkeleton />;
  if (bundles.length === 0) return <>{empty}</>;
  const cards = (list: typeof bundles) => (
    <div className="grid gap-4 sm:grid-cols-2">
      {list.map((b) => {
        const v = b.family ?? b.original;
        return <RecipeCard key={b.recipe.id} href={`/cong-thuc/mon/?id=${b.recipe.id}`} name={b.recipe.name} photo={<RecipePhoto imageId={b.recipe.imageId} name={b.recipe.name} videoId={b.recipe.source.youtubeVideoId} />} totalMinutes={v.prepMinutes + v.cookMinutes} servings={v.servings} badge={recipeBadge(b.recipe)} />;
      })}
    </div>
  );
  if (!grouped) return cards(bundles);
  return (
    <>
      {groupByType(bundles.map((b) => ({ ...b, categories: b.recipe.categories }))).map((g) => (
        <section key={g.type} aria-label={g.type} className="flex flex-col gap-3">
          <h2 className="flex items-baseline justify-between gap-3 border-b-2 border-gold pb-1 text-xl">
            {g.type}
            <span className="text-base font-normal text-text-muted">{g.recipes.length} món</span>
          </h2>
          {cards(g.recipes)}
        </section>
      ))}
    </>
  );
}
