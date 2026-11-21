"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Save } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BackLink } from "@/components/back-link";
import { Card, TextArea, TextField } from "@/components/editor/fields";
import { IngredientCard } from "@/components/editor/ingredient-card";
import { PhotoPicker } from "@/components/editor/photo-picker";
import { StepCard } from "@/components/editor/step-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Banner, ErrorState, Skeleton } from "@/components/ui/states";
import { discardDraft, getDraft, planEdit, saveDraft, saveRecipeForm, type EditPlan } from "@/data/repo";
import type { FormSourceKind, RecipeForm } from "@/data/types";
import { CATEGORY_ORDER, COMMON_EQUIPMENT, buildContent, contentOf, emptyForm, formFromRecipe, newIngredient, newStep, sameContent, sectionName, validateForm, youtubeId } from "@/features/editor/form";

const SECTIONS = [1, 2, 3, 4, 5] as const;
const REVIEW = 6;

export default function EditorPage() {
  return (
    <Suspense>
      <EditorScreen />
    </Suspense>
  );
}

type Loaded = { form: RecipeForm; plan: EditPlan | null; resumed: boolean };

function EditorScreen() {
  const recipeId = useSearchParams().get("id");
  const draftId = recipeId ?? "new";
  const [loaded, setLoaded] = useState<Loaded | null | "missing">(null);
  // Bumped by "Soạn lại từ đầu", so the form is loaded again without the draft.
  const [round, setRound] = useState(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const plan = recipeId ? await planEdit(recipeId) : null;
      if (recipeId && !plan) {
        if (alive) setLoaded("missing");
        return;
      }
      const draft = await getDraft(draftId);
      // A draft made from a version that is no longer the one in use is out of date.
      const usable = draft && (plan ? draft.baseVersionId === plan.base.id : true) ? draft : null;
      const form = usable?.form ?? (plan ? formFromRecipe(plan.bundle.recipe, plan.base) : emptyForm());
      if (alive) setLoaded({ form, plan, resumed: usable != null });
    })();
    return () => {
      alive = false;
    };
  }, [recipeId, draftId, round]);

  const back = recipeId ? `/cong-thuc/mon/?id=${recipeId}` : "/cong-thuc/";
  return (
    <AppShell tab="recipes">
      <BackLink href={back}>{recipeId ? "Quay lại món" : "Công thức"}</BackLink>
      {loaded === null ? (
        <Skeleton className="h-64 w-full" />
      ) : loaded === "missing" ? (
        <ErrorState>Không tìm thấy món này. Có thể món đã bị xoá.</ErrorState>
      ) : (
        <Editor
          key={`${draftId}-${round}`}
          draftId={draftId}
          loaded={loaded}
          backHref={back}
          onStartOver={async () => {
            await discardDraft(draftId);
            setLoaded(null);
            setRound((r) => r + 1);
          }}
        />
      )}
    </AppShell>
  );
}

function Editor({ draftId, loaded, backHref, onStartOver }: { draftId: string; loaded: Loaded; backHref: string; onStartOver: () => Promise<void> }) {
  const router = useRouter();
  const { plan } = loaded;
  const [form, setForm] = useState(loaded.form);
  const latest = useRef(loaded.form);
  const [section, setSection] = useState(1);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askDiscard, setAskDiscard] = useState(false);
  const [touched, setTouched] = useState(loaded.resumed);

  /** Every change is written to the draft at once, so closing the app loses nothing. */
  const change = (patch: Partial<RecipeForm>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setForm(next);
    setTouched(true);
    void saveDraft(draftId, next, plan?.base.id ?? null);
  };

  const go = (n: number) => {
    setSection(n);
    setError(null);
    window.scrollTo({ top: 0 });
  };

  const problems = validateForm(form);
  const contentChanged = plan != null && !sameContent(buildContent(form, plan.base), contentOf(plan.base));
  const makesNewVersion = contentChanged && !plan.inPlace;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await saveRecipeForm({ form, recipeId: plan?.bundle.recipe.id, baseVersionId: plan?.base.id, reason });
      router.push(`/cong-thuc/mon/?id=${r.recipeId}`);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Chưa lưu được. Mẹ thử lại nhé.");
      setSaving(false);
    }
  };

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-xl">{plan ? `Sửa món: ${plan.bundle.recipe.name}` : "Thêm món mới"}</h1>
        <p className="text-text-muted">Viết tới đâu máy tự giữ tới đó. Mẹ có thể đóng lại rồi mở ra viết tiếp.</p>
      </header>

      {loaded.resumed && section === 1 && (
        <Banner action={<Button variant="secondary" onClick={() => setAskDiscard(true)}>Soạn lại từ đầu</Button>}>Đây là phần mẹ đang viết dở lần trước.</Banner>
      )}

      <nav aria-label="Các phần của công thức" className="flex flex-wrap gap-2">
        {SECTIONS.map((n) => (
          <Chip key={n} selected={section === n} aria-current={section === n ? "step" : undefined} onClick={() => go(n)}>
            {n}. {sectionName(n)}
          </Chip>
        ))}
        <Chip selected={section === REVIEW} aria-current={section === REVIEW ? "step" : undefined} onClick={() => go(REVIEW)}>
          Xem lại và lưu
        </Chip>
      </nav>

      {section === 1 && <NameSection form={form} change={change} />}
      {section === 2 && <IngredientsSection form={form} change={change} />}
      {section === 3 && <EquipmentSection form={form} change={change} />}
      {section === 4 && <StepsSection form={form} change={change} />}
      {section === 5 && <SourceSection form={form} change={change} isSample={plan?.bundle.recipe.source.kind === "sample"} />}

      {section === REVIEW && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl">Xem lại và lưu</h2>
          <ul className="flex list-disc flex-col gap-1 pl-7 text-lg font-normal">
            <li>{form.name.trim() || "Chưa có tên món"} — cho {form.servings} người</li>
            <li>
              {form.ingredients.filter((i) => i.kind === "food").length} nguyên liệu, {form.ingredients.filter((i) => i.kind === "seasoning").length} gia vị
            </li>
            <li>{form.steps.length} bước nấu</li>
            <li>{form.imageId ? "Có ảnh món" : "Chưa có ảnh món"}</li>
          </ul>

          {problems.length > 0 ? (
            <div role="alert" className="flex flex-col gap-3 rounded-lg border-2 border-danger bg-surface p-4">
              <p className="text-lg">Còn {problems.length} chỗ cần bổ sung rồi mới lưu được:</p>
              {SECTIONS.filter((n) => problems.some((p) => p.section === n)).map((n) => (
                <div key={n} className="flex flex-col gap-2">
                  <ul className="flex list-disc flex-col gap-1 pl-7">
                    {problems.filter((p) => p.section === n).map((p, i) => (
                      <li key={i}>{p.message}</li>
                    ))}
                  </ul>
                  <Button variant="secondary" className="self-start" onClick={() => go(n)}>
                    Sửa phần {n}: {sectionName(n)}
                  </Button>
                </div>
              ))}
            </div>
          ) : !plan ? (
            <Banner>Món mới sẽ mang nhãn “Mới nhập – chưa nấu thử”. Sau một lần nấu được khen, mẹ có thể đánh dấu “Gia đình đã duyệt”.</Banner>
          ) : makesNewVersion ? (
            <>
              <Banner>Phần nguyên liệu hoặc cách nấu có thay đổi. Máy sẽ lưu thành “Bản nhà mình” mới; bản cũ vẫn được giữ nguyên trong lịch sử.</Banner>
              <TextField label="Vì sao sửa? (không bắt buộc)" value={reason} onChange={setReason} placeholder="Ví dụ: thêm bước ướp, bớt đường" />
            </>
          ) : contentChanged ? (
            <Banner>Món này chưa nấu lần nào nên máy sửa thẳng vào công thức.</Banner>
          ) : touched ? (
            <Banner>Nguyên liệu và cách nấu không đổi. Máy chỉ cập nhật tên, ảnh, loại món và nguồn.</Banner>
          ) : (
            <Banner>Mẹ chưa sửa gì.</Banner>
          )}

          {error && <Banner kind="error">{error}</Banner>}
          {touched && (
            <Button variant="quiet" className="self-start text-danger" onClick={() => setAskDiscard(true)}>
              {plan ? "Bỏ các thay đổi đang viết" : "Bỏ món đang viết dở"}
            </Button>
          )}
        </section>
      )}

      <div className="sticky bottom-18 z-10 -mx-4 flex gap-3 border-t border-border bg-bg px-4 py-3">
        {section > 1 && (
          <Button variant="secondary" onClick={() => go(section - 1)}>
            Quay lại
          </Button>
        )}
        {section < REVIEW ? (
          <Button size="lg" className="flex-1" onClick={() => go(section + 1)}>
            {section === 5 ? "Xem lại và lưu" : `Tiếp: ${sectionName(section + 1)}`}
          </Button>
        ) : (
          <Button size="lg" className="flex-1" disabled={problems.length > 0} loading={saving} icon={<Save aria-hidden className="size-7" />} onClick={() => void save()}>
            {plan ? "Lưu thay đổi" : "Lưu món mới"}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={askDiscard}
        title={plan ? "Bỏ các thay đổi đang viết?" : "Bỏ món đang viết dở?"}
        confirmLabel={plan ? "Bỏ thay đổi" : "Bỏ món đang viết"}
        cancelLabel="Không, viết tiếp"
        danger
        onCancel={() => setAskDiscard(false)}
        onConfirm={() => {
          setAskDiscard(false);
          if (plan) void discardDraft(draftId).then(() => router.push(backHref));
          else void onStartOver();
        }}
      >
        <p>{plan ? "Những gì mẹ vừa sửa sẽ mất. Món đã lưu trước đó vẫn còn nguyên." : "Những gì mẹ đã viết cho món này sẽ mất và không lấy lại được."}</p>
      </ConfirmDialog>
    </>
  );
}

type SectionProps = { form: RecipeForm; change: (patch: Partial<RecipeForm>) => void };

function NameSection({ form, change }: SectionProps) {
  const toggle = (c: string) => change({ categories: form.categories.includes(c) ? form.categories.filter((x) => x !== c) : [...form.categories, c] });
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-xl">1. Tên món</h2>
      <TextField label="Tên món" value={form.name} maxLength={80} placeholder="Ví dụ: Thịt kho trứng" onChange={(v) => change({ name: v })} />
      <TextArea label="Vài lời về món (không bắt buộc)" value={form.description} maxLength={300} rows={2} placeholder="Ví dụ: Món mặn ngày Tết, ăn với dưa giá." onChange={(v) => change({ description: v })} />
      <div className="flex flex-col gap-2">
        <p className="font-medium">Loại món (chọn một hay nhiều)</p>
        <div role="group" aria-label="Loại món" className="flex flex-wrap gap-3">
          {CATEGORY_ORDER.map((c) => (
            <Chip key={c} selected={form.categories.includes(c)} onClick={() => toggle(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-medium">Công thức này nấu cho mấy người?</p>
        <QuantityStepper name="số người ăn" value={form.servings} unit="người" step={1} min={1} max={30} onChange={(v) => change({ servings: Math.round(v) })} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-medium">Thời gian chuẩn bị</p>
        <QuantityStepper name="phút chuẩn bị" value={form.prepMinutes} unit="phút" step={5} min={0} max={600} onChange={(v) => change({ prepMinutes: Math.round(v) })} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-medium">Thời gian nấu</p>
        <QuantityStepper name="phút nấu" value={form.cookMinutes} unit="phút" step={5} min={0} max={600} onChange={(v) => change({ cookMinutes: Math.round(v) })} />
      </div>
      <PhotoPicker imageId={form.imageId} name={form.name} onChange={(imageId) => change({ imageId })} />
    </section>
  );
}

function IngredientsSection({ form, change }: SectionProps) {
  const list = (kind: "food" | "seasoning") => {
    const items = form.ingredients.filter((i) => i.kind === kind);
    const noun = kind === "food" ? "nguyên liệu" : "gia vị";
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-xl">{kind === "food" ? "Nguyên liệu" : "Gia vị"}</h3>
        {items.length === 0 && <p className="text-text-muted">Chưa có {noun} nào.</p>}
        {items.map((ing, n) => (
          <IngredientCard
            key={ing.slot}
            index={n}
            value={ing}
            onChange={(v) => change({ ingredients: form.ingredients.map((i) => (i.slot === ing.slot ? v : i)) })}
            onRemove={() => change({ ingredients: form.ingredients.filter((i) => i.slot !== ing.slot) })}
          />
        ))}
        <Button variant="secondary" fullWidth icon={<Plus aria-hidden className="size-6" />} onClick={() => change({ ingredients: [...form.ingredients, newIngredient(kind)] })}>
          Thêm {noun}
        </Button>
      </div>
    );
  };
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl">2. Nguyên liệu và gia vị</h2>
        <p className="text-text-muted">Ghi lượng cho {form.servings} người. Khi nấu cho số người khác, máy tự tính lại.</p>
      </div>
      {list("food")}
      {list("seasoning")}
    </section>
  );
}

function EquipmentSection({ form, change }: SectionProps) {
  const [custom, setCustom] = useState("");
  const has = (name: string) => form.equipment.some((e) => e.name === name);
  const addCustom = () => {
    const name = custom.trim();
    if (name && !has(name)) change({ equipment: [...form.equipment, { name, kind: "utensil", required: true }] });
    setCustom("");
  };
  const extra = form.equipment.filter((e) => !COMMON_EQUIPMENT.some((c) => c.name === e.name));
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl">3. Dụng cụ</h2>
        <p className="text-text-muted">Bấm vào những thứ cần dùng. Phần này không bắt buộc.</p>
      </div>
      <div role="group" aria-label="Dụng cụ thường dùng" className="flex flex-wrap gap-3">
        {COMMON_EQUIPMENT.map((c) => (
          <Chip key={c.name} selected={has(c.name)} onClick={() => change({ equipment: has(c.name) ? form.equipment.filter((e) => e.name !== c.name) : [...form.equipment, { ...c }] })}>
            {c.name}
          </Chip>
        ))}
      </div>
      {extra.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Dụng cụ khác (bấm để bỏ)</p>
          <div className="flex flex-wrap gap-3">
            {extra.map((e) => (
              <Chip key={e.name} selected aria-label={`Bỏ ${e.name}`} onClick={() => change({ equipment: form.equipment.filter((x) => x.name !== e.name) })}>
                {e.name}
              </Chip>
            ))}
          </div>
        </div>
      )}
      <TextField label="Dụng cụ khác" value={custom} maxLength={80} placeholder="Ví dụ: Nồi đất" onChange={setCustom} />
      <Button variant="secondary" className="self-start" disabled={!custom.trim()} icon={<Plus aria-hidden className="size-6" />} onClick={addCustom}>
        Thêm dụng cụ này
      </Button>
    </section>
  );
}

function StepsSection({ form, change }: SectionProps) {
  const move = (index: number, by: -1 | 1) => {
    const steps = [...form.steps];
    const [s] = steps.splice(index, 1);
    steps.splice(index + by, 0, s);
    change({ steps });
  };
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl">4. Các bước nấu</h2>
        <p className="text-text-muted">Mỗi bước là một màn hình khi nấu. Bước nào cũng cần ghi “Được khi…” và “Tránh…”.</p>
      </div>
      {form.steps.length === 0 && <p className="text-text-muted">Chưa có bước nào.</p>}
      {form.steps.map((s, n) => (
        <StepCard
          key={s.key}
          index={n}
          count={form.steps.length}
          value={s}
          ingredients={form.ingredients}
          steps={form.steps}
          onChange={(v) => change({ steps: form.steps.map((x) => (x.key === s.key ? v : x)) })}
          onRemove={() => change({ steps: form.steps.filter((x) => x.key !== s.key) })}
          onMove={(by) => move(n, by)}
        />
      ))}
      <Button variant="secondary" fullWidth icon={<Plus aria-hidden className="size-6" />} onClick={() => change({ steps: [...form.steps, newStep()] })}>
        Thêm bước
      </Button>
    </section>
  );
}

const SOURCES: Array<{ id: FormSourceKind; label: string }> = [
  { id: "family", label: "Của nhà mình" },
  { id: "youtube", label: "Viết lại theo video YouTube" },
  { id: "other", label: "Từ sách, báo, trang mạng" },
];

function SourceSection({ form, change, isSample }: SectionProps & { isSample: boolean }) {
  const link = form.sourceUrl.trim();
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-xl">5. Nguồn và ghi chú</h2>
      {isSample ? (
        <Banner>Đây là công thức mẫu của ứng dụng nên phần nguồn được giữ nguyên.</Banner>
      ) : (
        <Card title="Công thức này từ đâu?">
          <div role="radiogroup" aria-label="Nguồn công thức" className="flex flex-wrap gap-3">
            {SOURCES.map((s) => (
              <Chip key={s.id} selected={form.sourceKind === s.id} onClick={() => change({ sourceKind: s.id })}>
                {s.label}
              </Chip>
            ))}
          </div>
          {form.sourceKind === "youtube" && (
            <>
              <TextField label="Link video YouTube" type="url" inputMode="url" maxLength={300} value={form.sourceUrl} placeholder="https://www.youtube.com/watch?v=…" onChange={(v) => change({ sourceUrl: v })} hint={link === "" ? "Mở video, bấm Chia sẻ → Sao chép liên kết, rồi dán vào đây." : youtubeId(link) ? "Đã nhận ra video." : "Chưa phải link YouTube đúng."} />
              <TextField label="Tên video (không bắt buộc)" value={form.sourceTitle} onChange={(v) => change({ sourceTitle: v })} />
              <TextField label="Tên kênh (không bắt buộc)" value={form.sourceCreator} onChange={(v) => change({ sourceCreator: v })} />
              <p className="text-text-muted">Món sẽ ghi rõ “Viết lại theo video” kèm link, để biết lượng là do nhà mình ghi lại chứ không phải của người làm video.</p>
            </>
          )}
          {form.sourceKind === "other" && (
            <>
              <TextField label="Tên sách, báo hoặc trang mạng" value={form.sourceTitle} onChange={(v) => change({ sourceTitle: v })} />
              <TextField label="Tác giả (không bắt buộc)" value={form.sourceCreator} onChange={(v) => change({ sourceCreator: v })} />
              <TextField label="Link (không bắt buộc)" type="url" inputMode="url" maxLength={300} value={form.sourceUrl} placeholder="https://…" onChange={(v) => change({ sourceUrl: v })} />
            </>
          )}
          <TextField label={form.sourceKind === "family" ? "Ai chỉ, học từ đâu? (không bắt buộc)" : "Ghi chú về nguồn (không bắt buộc)"} value={form.sourceNote} placeholder={form.sourceKind === "family" ? "Ví dụ: Bà ngoại chỉ" : undefined} onChange={(v) => change({ sourceNote: v })} />
        </Card>
      )}
      <TextArea label="Lưu ý khi nấu (không bắt buộc)" value={form.notes} maxLength={600} placeholder="Ví dụ: Kho xong để nguội rồi hâm lại sẽ ngon hơn." onChange={(v) => change({ notes: v })} />
      <TextArea label="Mẹo nêm nếm (không bắt buộc)" value={form.tasteTips} maxLength={600} placeholder="Ví dụ: Hơi mặn thì lần sau bớt nửa muỗng nước mắm." onChange={(v) => change({ tasteTips: v })} />
    </section>
  );
}
