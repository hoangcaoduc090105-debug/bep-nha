"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronRight, Dices, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listJournal, listRecipes } from "@/data/repo";
import type { Recipe } from "@/data/types";
import { isMain, isSoup, suggestMain, suggestMeal, suggestSoup, type LastCooked, type Meal } from "@/features/suggest/meal";

const SPIN_MS = 1400;
const TICK_MS = 110;

/**
 * "Hôm nay nấu gì?": one press picks a meal — a dish to eat with rice and a soup. The names
 * flick past for a moment, like drawing lots, then stop. Either dish can be changed on its own.
 */
export function MealSuggestion() {
  const data = useLiveQuery(async () => {
    const last: LastCooked = new Map();
    // The journal is newest first, so the first time a dish is seen is its latest meal.
    for (const e of await listJournal()) if (e.session.finishedAt && !last.has(e.session.recipeId)) last.set(e.session.recipeId, e.session.finishedAt);
    return { recipes: await listRecipes(), last };
  }, []);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [spinning, setSpinning] = useState<{ main: boolean; soup: boolean }>({ main: false, soup: false });
  const [flick, setFlick] = useState<{ main: string; soup: string }>({ main: "", soup: "" });
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  if (!data || data.recipes.length === 0) return null;
  const { recipes, last } = data;

  /** Shows names flicking past for the chosen parts, then settles on `next`. */
  const draw = (parts: { main: boolean; soup: boolean }, next: Meal) => {
    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) return setMeal(next);
    const names = (soup: boolean) => recipes.filter((r) => (soup ? isSoup(r) : isMain(r))).map((r) => r.name);
    const mains = names(false);
    const soups = names(true);
    setSpinning(parts);
    let n = 0;
    const tick = () => {
      n += 1;
      setFlick({ main: mains[(n * 7) % Math.max(1, mains.length)] ?? "", soup: soups[(n * 3) % Math.max(1, soups.length)] ?? "" });
      if (n * TICK_MS < SPIN_MS) timers.current.push(window.setTimeout(tick, TICK_MS));
      else {
        setMeal(next);
        setSpinning({ main: false, soup: false });
      }
    };
    tick();
  };

  const busy = spinning.main || spinning.soup;
  const whole = () => draw({ main: true, soup: true }, suggestMeal(recipes, last, Date.now(), Math.random, { main: meal?.main?.id, soup: meal?.soup?.id }));
  const otherMain = () => meal && draw({ main: true, soup: false }, { ...meal, main: suggestMain(recipes, last, Date.now(), Math.random, meal.main?.id) });
  const otherSoup = () => meal && draw({ main: false, soup: true }, { ...meal, soup: suggestSoup(recipes, last, Date.now(), Math.random, meal.soup?.id) });

  const shown = meal != null || busy;
  return (
    <section aria-label="Gợi ý hôm nay nấu gì" className="flex flex-col gap-4 rounded-lg border-2 border-gold bg-gold-soft p-4">
      {!shown && <p className="text-lg">Chưa biết nấu gì? Để máy chọn giúp một mâm: một món mặn và một món canh.</p>}
      {shown && (
        <div aria-live="polite" className="flex flex-col gap-3">
          <Pick label="Món mặn" dish={meal?.main ?? null} spinning={spinning.main} flick={flick.main} onOther={otherMain} busy={busy} none="Chưa có món mặn nào." />
          <Pick label="Món canh" dish={meal?.soup ?? null} spinning={spinning.soup} flick={flick.soup} onOther={otherSoup} busy={busy} none="Chưa có món canh nào." />
        </div>
      )}
      <Button size="lg" fullWidth disabled={busy} icon={shown ? <RefreshCw aria-hidden className="size-7 shrink-0" /> : <Dices aria-hidden className="size-7 shrink-0" />} onClick={whole}>
        {shown ? "Chọn mâm khác" : "Hôm nay nấu gì?"}
      </Button>
    </section>
  );
}

function Pick({ label, dish, spinning, flick, onOther, busy, none }: { label: string; dish: Recipe | null; spinning: boolean; flick: string; onOther: () => void; busy: boolean; none: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-surface p-4 shadow-card">
      <p className="font-medium text-text-muted">{label}</p>
      {spinning ? (
        <p aria-hidden className="min-h-14 text-xl text-text-muted">
          {flick}
        </p>
      ) : dish ? (
        <Link href={`/cong-thuc/mon/?id=${dish.id}`} className="flex min-h-target items-center justify-between gap-3 text-xl font-semibold text-accent">
          <span>{dish.name}</span>
          <span className="inline-flex shrink-0 items-center text-base font-medium">
            Xem món <ChevronRight aria-hidden className="size-6" />
          </span>
        </Link>
      ) : (
        <p className="min-h-14 text-lg text-text-muted">{none}</p>
      )}
      {dish && !spinning && (
        <Button variant="quiet" disabled={busy} onClick={onOther}>
          Đổi {label.toLowerCase()} khác
        </Button>
      )}
    </div>
  );
}
