"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Clock, Heart, Play, SlidersHorizontal, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IngredientRow } from "@/components/ui/ingredient-row";
import { PhotoTile } from "@/components/ui/photo-tile";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Banner, ErrorState, Skeleton } from "@/components/ui/states";
import { VersionBadge, VersionSwitch } from "@/components/ui/version";
import { archiveRecipe, getRecipeBundle, setPreferredVersion, startSession, toggleFavorite, type RecipeBundle } from "@/data/repo";
import type { Ingredient } from "@/data/types";
import { diffVersions, fillStepText, scaledIngredients } from "@/features/recipe-text";
import { formatAmount, formatMetric } from "@/lib/quantity";
import { formatDateTime, versionName } from "@/lib/labels";

export default function RecipePage() {
  return (
    <Suspense>
      <RecipeScreen />
    </Suspense>
  );
}

function RecipeScreen() {
  const id = useSearchParams().get("id") ?? "";
  const bundle = useLiveQuery(() => getRecipeBundle(id).then((b) => b ?? null), [id]);
  return (
    <AppShell tab="recipes">
      <BackLink href="/cong-thuc/">Công thức</BackLink>
      {bundle === undefined ? (
        <Skeleton className="h-64 w-full" />
      ) : bundle === null ? (
        <ErrorState>Không tìm thấy món này. Có thể món đã bị xoá.</ErrorState>
      ) : (
        <RecipeDetail bundle={bundle} />
      )}
    </AppShell>
  );
}

function IngredientGroup({ title, items }: { title: string; items: Ingredient[] }) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl">{title}</h2>
      <div className="rounded-lg bg-surface p-2 shadow-card">
        {items.map((i) => (
          <IngredientRow key={i.slot} name={i.name} amount={formatAmount(i.quantity, i.unit)} metric={formatMetric(i.metricQuantity, i.metricUnit)} prepNote={i.prepNote} optional={i.optional} />
        ))}
      </div>
    </section>
  );
}

function RecipeDetail({ bundle }: { bundle: RecipeBundle }) {
  const router = useRouter();
  const { recipe, original, family } = bundle;
  // Until she chooses otherwise, show the family's version when there is one.
  const [choice, setChoice] = useState<"family" | "original" | null>(null);
  const view = choice ?? (family ? "family" : "original");
  const version = view === "family" && family ? family : original;
  const [servingsChoice, setServings] = useState<number | null>(null);
  const servings = servingsChoice ?? version.servings;
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askDelete, setAskDelete] = useState(false);

  const ingredients = scaledIngredients(version, servings);
  const changes = family ? diffVersions(original, family).filter((d) => d.changed) : [];

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      await startSession(recipe.id, version.id, servings);
      router.push("/dang-nau/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa bắt đầu được. Mẹ thử lại nhé.");
      setStarting(false);
    }
  };

  return (
    <>
      <PhotoTile name={recipe.name} />
      <header className="flex flex-col gap-3">
        <h1 className="text-display">{recipe.name}</h1>
        <div className="flex flex-wrap gap-2">
          <VersionBadge kind={view === "family" ? "family" : "original"} />
          {recipe.verification === "sample" && <VersionBadge kind="sample" />}
          {recipe.verification === "family_approved" && <VersionBadge kind="approved" />}
        </div>
        <p>{recipe.description}</p>
        <p className="flex items-center gap-2 text-text-muted">
          <Clock aria-hidden className="size-6" /> Chuẩn bị {version.prepMinutes} phút · Nấu {version.cookMinutes} phút
        </p>
      </header>

      {recipe.verification === "sample" && (
        <Banner>Đây là công thức mẫu, chưa được nhà mình nấu thử. Mẹ nấu rồi chỉnh lại cho vừa miệng nhé.</Banner>
      )}

      {family && <VersionSwitch value={view} onChange={setChoice} />}
      {view === "family" && family?.changeReason && <p className="text-text-muted">Lý do chỉnh: {family.changeReason}</p>}

      <section className="flex flex-col gap-2">
        <h2 className="text-xl">Số người ăn</h2>
        <QuantityStepper name="số người ăn" value={servings} unit={null} step={1} min={1} max={30} onChange={setServings} />
        {servings !== version.servings && (
          <p className="text-text-muted">Đã tính lại lượng cho {servings} người. Gia vị mẹ nêm lại cho vừa; thời gian nấu có thể lâu hơn hoặc nhanh hơn một chút.</p>
        )}
      </section>

      <IngredientGroup title="Nguyên liệu" items={ingredients.filter((i) => i.kind === "food")} />
      <IngredientGroup title="Gia vị" items={ingredients.filter((i) => i.kind === "seasoning")} />

      {view === "family" && changes.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xl">Khác với bản gốc</h2>
          <ul className="flex flex-col gap-2 rounded-lg bg-accent-soft p-4">
            {changes.map((c) => (
              <li key={c.slot} className="text-lg font-normal">
                <strong className="font-semibold">{c.name}:</strong> {formatAmount(c.to, c.unit)} <span className="text-text-muted">(bản gốc: {formatAmount(c.from, c.unit)})</span>
              </li>
            ))}
          </ul>
          <Button variant="quiet" className="self-start" onClick={() => void setPreferredVersion(recipe.id, null).then(() => setChoice(null))}>
            Dùng lại bản gốc
          </Button>
        </section>
      )}
      {!family && bundle.versions.length > 1 && (
        <Button variant="quiet" className="self-start" onClick={() => void setPreferredVersion(recipe.id, bundle.versions[bundle.versions.length - 1].id)}>
          Dùng lại bản nhà mình gần nhất
        </Button>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xl">Dụng cụ</h2>
        <ul className="flex list-disc flex-col gap-1 pl-7">
          {version.equipment.map((e) => (
            <li key={e.name}>
              {e.name}
              {e.alternative && <span className="block text-text-muted">{e.alternative}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl">Các bước ({version.steps.length} bước)</h2>
        <ol className="flex flex-col gap-3">
          {version.steps.map((s) => (
            <li key={s.no} className="rounded-lg bg-surface p-4 shadow-card">
              <p className="text-lg">
                {s.no}. {s.title}
              </p>
              <p className="text-text-muted">{s.instructions.map((t) => fillStepText(t, ingredients)).join(" ")}</p>
            </li>
          ))}
        </ol>
      </section>

      {version.notes && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xl">Lưu ý</h2>
          <p>{version.notes}</p>
        </section>
      )}
      {version.tasteTips && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xl">Nêm nếm</h2>
          <p>{version.tasteTips}</p>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xl">Nguồn</h2>
        <p>{recipe.source.title}</p>
        {recipe.source.note && <p className="text-text-muted">{recipe.source.note}</p>}
        {recipe.source.url && (
          <a href={recipe.source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-target items-center text-lg font-medium text-accent underline">
            Mở nguồn gốc
          </a>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl">Lịch sử phiên bản</h2>
        <ol className="flex flex-col gap-2">
          {bundle.versions.map((v) => (
            <li key={v.id} className="rounded-md bg-surface-warm p-3">
              <span className="font-medium">{versionName(v)}</span>
              {v.id === (family?.id ?? original.id) && <span className="text-secondary"> · đang dùng</span>}
              <span className="block text-sm text-text-muted">{formatDateTime(v.createdAt)}</span>
              {v.changeReason && <span className="block text-text-muted">Lý do: {v.changeReason}</span>}
            </li>
          ))}
        </ol>
        <p className="text-text-muted">Đã nấu {bundle.timesCooked} lần.</p>
      </section>

      <div className="flex flex-col gap-3">
        <Link href={`/cong-thuc/chinh/?id=${recipe.id}`} className="inline-flex min-h-target items-center justify-center gap-3 rounded-md border-2 border-border-input bg-surface px-6 text-lg font-semibold">
          <SlidersHorizontal aria-hidden className="size-6" /> Chỉnh theo khẩu vị nhà mình
        </Link>
        <Button variant="secondary" aria-pressed={recipe.isFavorite} icon={<Heart aria-hidden className="size-6" fill={recipe.isFavorite ? "currentColor" : "none"} />} onClick={() => void toggleFavorite(recipe.id)}>
          {recipe.isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
        </Button>
        <Button variant="quiet" className="self-start text-danger" icon={<Trash2 aria-hidden className="size-6" />} onClick={() => setAskDelete(true)}>
          Xoá món này
        </Button>
      </div>
      <ConfirmDialog
        open={askDelete}
        title={`Xoá món “${recipe.name}”?`}
        confirmLabel="Xoá món này"
        danger
        onCancel={() => setAskDelete(false)}
        onConfirm={() => void archiveRecipe(recipe.id).then(() => router.push("/cong-thuc/"))}
      >
        <p>Món sẽ được cất vào “Món đã xoá” trong Cài đặt và lấy lại được bất cứ lúc nào. Nhật ký nấu vẫn được giữ.</p>
      </ConfirmDialog>

      {error && <Banner kind="error">{error}</Banner>}
      <div className="sticky bottom-18 z-10 -mx-4 border-t border-border bg-bg px-4 py-3">
        <Button size="lg" fullWidth loading={starting} icon={<Play aria-hidden className="size-7" />} onClick={() => void start()}>
          Bắt đầu nấu
        </Button>
      </div>
    </>
  );
}
