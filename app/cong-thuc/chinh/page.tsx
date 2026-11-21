"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "@/components/app-shell";
import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Banner, ErrorState, Skeleton } from "@/components/ui/states";
import { getRecipeBundle, saveFamilyVersion, type RecipeBundle } from "@/data/repo";
import type { Ingredient, Unit } from "@/data/types";

const REASONS = ["Bớt mặn", "Bớt ngọt", "Thêm đậm đà", "Bớt cay", "Nhà thích vậy"];

/** How much one press of − or + changes, chosen so the amounts stay measurable. */
function stepFor(unit: Unit | null, quantity: number): number {
  if (unit === "muong_ca_phe" || unit === "muong_canh" || unit === "chen") return 0.25;
  if (unit === "g" || unit === "ml") return quantity >= 200 ? 50 : 10;
  if (unit === "kg" || unit === "l") return 0.1;
  return 0.5;
}

export default function AdjustPage() {
  return (
    <Suspense>
      <AdjustScreen />
    </Suspense>
  );
}

function AdjustScreen() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const bundle = useLiveQuery(() => getRecipeBundle(id).then((b) => b ?? null), [id]);
  return (
    <AppShell tab="recipes">
      <BackLink href={`/cong-thuc/mon/?id=${id}`}>Quay lại món</BackLink>
      {bundle === undefined ? <Skeleton className="h-64 w-full" /> : bundle === null ? <ErrorState>Không tìm thấy món này.</ErrorState> : <AdjustForm bundle={bundle} initialReason={params.get("ly_do") ?? ""} fromSessionId={params.get("lan_nau") ?? undefined} />}
    </AppShell>
  );
}

function AdjustForm({ bundle, initialReason, fromSessionId }: { bundle: RecipeBundle; initialReason: string; fromSessionId?: string }) {
  const router = useRouter();
  const { recipe, original } = bundle;
  const base = bundle.family ?? original;
  const [values, setValues] = useState<Record<string, number>>({});
  const [reason, setReason] = useState(initialReason);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalBySlot = new Map(original.ingredients.map((i) => [i.slot, i.quantity]));
  const adjustable = base.ingredients.filter((i) => i.quantity != null);
  const changes = adjustable.filter((i) => values[i.slot] != null && values[i.slot] !== i.quantity).map((i) => ({ slot: i.slot, quantity: values[i.slot] }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveFamilyVersion({ recipeId: recipe.id, baseVersionId: base.id, changes, reason, fromSessionId });
      router.push(`/cong-thuc/mon/?id=${recipe.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa lưu được. Mẹ thử lại nhé.");
      setSaving(false);
    }
  };

  const row = (i: Ingredient) => {
    const value = values[i.slot] ?? i.quantity!;
    const step = stepFor(i.unit, i.quantity!);
    return (
      <div key={i.slot} className="rounded-lg bg-surface p-3 shadow-card">
        <p className="px-2 text-lg">{i.name}</p>
        <QuantityStepper name={i.name.toLowerCase()} value={value} unit={i.unit} step={step} min={step} max={Math.max(i.quantity! * 10, step * 40)} original={originalBySlot.get(i.slot) ?? undefined} onChange={(v) => setValues((cur) => ({ ...cur, [i.slot]: v }))} />
      </div>
    );
  };

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-xl">Chỉnh theo khẩu vị nhà mình</h1>
        <p className="text-lg font-normal">{recipe.name}</p>
        <p className="text-text-muted">Bản gốc luôn được giữ nguyên. Lượng mẹ chỉnh sẽ lưu thành “Bản nhà mình”.</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Gia vị</h2>
        {adjustable.filter((i) => i.kind === "seasoning").map(row)}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Nguyên liệu</h2>
        {adjustable.filter((i) => i.kind === "food").map(row)}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Vì sao đổi? (không bắt buộc)</h2>
        <div className="flex flex-wrap gap-3">
          {REASONS.map((r) => (
            <Chip key={r} selected={reason === r} onClick={() => setReason(reason === r ? "" : r)}>
              {r}
            </Chip>
          ))}
        </div>
        <label className="flex flex-col gap-2">
          <span className="font-medium">Hoặc ghi lý do khác</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} className="min-h-target rounded-md border-2 border-border-input bg-surface px-4 text-lg" />
        </label>
      </section>

      {error && <Banner kind="error">{error}</Banner>}
      {changes.length === 0 && <p className="text-text-muted">Mẹ bấm dấu − hoặc + để đổi lượng rồi mới lưu được.</p>}
      <div className="sticky bottom-18 z-10 -mx-4 border-t border-border bg-bg px-4 py-3">
        <Button size="lg" fullWidth disabled={changes.length === 0} loading={saving} onClick={() => void save()}>
          Lưu bản nhà mình
        </Button>
      </div>
    </>
  );
}
