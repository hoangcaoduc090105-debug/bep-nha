"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FeedbackOptions, type FeedbackId } from "@/components/ui/feedback-option";
import { IngredientRow } from "@/components/ui/ingredient-row";
import { Banner, EmptyState } from "@/components/ui/states";
import { Avoid, DoneWhen, StepProgress } from "@/components/ui/step";
import { TimerBar, TimerButton } from "@/components/ui/timer";
import { SpeakButton } from "@/components/ui/voice";
import { abandonSession, confirmFamilyApproved, finishSession, getActiveSession, getRecipeBundle, getSetting, updateSession } from "@/data/repo";
import { DEFAULTS } from "@/lib/settings";
import type { CookingSession, Recipe, RecipeVersion, SessionTimer } from "@/data/types";
import { ringAlarm, unlockAudio } from "@/features/cooking/alarm";
import { addSeconds, createTimer, pauseTimer, remaining, resumeTimer, timerState } from "@/features/cooking/timers";
import { useWakeLock } from "@/features/cooking/use-wake-lock";
import { fillStepText, ingredientsSpeech, scaledIngredients, stepSpeech } from "@/features/recipe-text";
import { useSpeech } from "@/features/voice/tts";
import { formatAmount, formatMetric } from "@/lib/quantity";
import { VERDICT_LABELS, versionName } from "@/lib/labels";

type Loaded = { session: CookingSession; recipe: Recipe; version: RecipeVersion };
/** `verdict` is null when she finished without rating the meal. */
type Finished = { recipe: Recipe; sessionId: string; verdict: FeedbackId | null; approved: boolean };

export default function CookingPage() {
  const loaded = useLiveQuery(async (): Promise<Loaded | null> => {
    const session = await getActiveSession();
    if (!session) return null;
    const bundle = await getRecipeBundle(session.recipeId);
    const version = bundle?.versions.find((v) => v.id === session.versionId);
    return bundle && version ? { session, recipe: bundle.recipe, version } : null;
  }, []);
  // After "Nấu xong" the session is no longer active, so its summary is kept here.
  const [finished, setFinished] = useState<Finished | null>(null);

  if (finished) return <AfterCooking finished={finished} onChange={setFinished} />;
  if (loaded === undefined) return <AppShell tab="cooking">{null}</AppShell>;
  if (loaded === null) {
    return (
      <AppShell tab="cooking">
        <h1 className="text-xl">Đang nấu</h1>
        <EmptyState
          title="Mẹ chưa nấu món nào"
          action={
            <Link href="/cong-thuc/" className="inline-flex min-h-target items-center rounded-md bg-accent px-6 text-lg font-semibold text-on-accent">
              Chọn món để nấu
            </Link>
          }
        >
          Mở một công thức rồi bấm “Bắt đầu nấu”.
        </EmptyState>
      </AppShell>
    );
  }
  return <Cooking key={loaded.session.id} {...loaded} onFinished={setFinished} />;
}

function Cooking({ session, recipe, version, onFinished }: Loaded & { onFinished: (f: Finished) => void }) {
  const total = version.steps.length;
  const stepNo = session.currentStep;
  const ingredients = scaledIngredients(version, session.servings);
  const voice = useLiveQuery(async () => ({ rate: await getSetting("voiceRate", DEFAULTS.voiceRate), autoRead: await getSetting("autoRead", DEFAULTS.autoRead), uri: await getSetting("voiceURI", DEFAULTS.voiceURI) }), []);
  const speech = useSpeech(voice?.rate ?? DEFAULTS.voiceRate, voice?.uri ?? null);
  const wakeLockHeld = useWakeLock(true);
  const [askAbandon, setAskAbandon] = useState(false);

  // One clock for every timer on the screen.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  // Ring once for each timer that reaches zero.
  const rung = useRef(new Set<string>());
  useEffect(() => {
    for (const t of session.timers) {
      if (timerState(t, now) === "finished" && !rung.current.has(t.id)) {
        rung.current.add(t.id);
        ringAlarm();
      }
    }
  }, [session.timers, now]);

  const goTo = (n: number) => {
    unlockAudio();
    speech.stop();
    void updateSession(session.id, { currentStep: n });
    window.scrollTo({ top: 0 });
    // Reading starts from this tap, which is what browsers require before they will speak.
    if (voice?.autoRead && n >= 1 && n <= total) speech.speak(stepSpeech(version, n, session.servings));
  };
  const setTimers = (timers: SessionTimer[]) => void updateSession(session.id, { timers });
  const toggleChecked = (slot: string, on: boolean) => void updateSession(session.id, { checked: on ? [...new Set([...session.checked, slot])] : session.checked.filter((s) => s !== slot) });

  const timersBar = session.timers.length > 0 && (
    <div className="flex flex-col gap-3">
      {session.timers.map((t) => (
        <TimerBar
          key={t.id}
          label={t.label}
          remainingSeconds={remaining(t, now)}
          state={timerState(t, now)}
          onToggle={() => setTimers(session.timers.map((x) => (x.id !== t.id ? x : x.endsAt == null ? resumeTimer(x, Date.now()) : pauseTimer(x, Date.now()))))}
          onAddMinute={() => {
            rung.current.delete(t.id);
            setTimers(session.timers.map((x) => (x.id === t.id ? addSeconds(x, 60, Date.now()) : x)));
          }}
          onStop={() => setTimers(session.timers.filter((x) => x.id !== t.id))}
        />
      ))}
    </div>
  );

  const header = (
    <div className="flex items-center justify-between gap-3">
      <Link href="/" className="-ml-2 inline-flex min-h-target items-center gap-1 rounded-md px-2 text-lg font-medium text-accent">
        <ChevronLeft aria-hidden className="size-7" /> Thoát
      </Link>
      <p className="truncate text-text-muted">{recipe.name}</p>
    </div>
  );

  // ── Chuẩn bị: the ingredient checklist ──
  if (stepNo === 0) {
    return (
      <AppShell tab="cooking">
        {header}
        <h1 className="text-display">Chuẩn bị nguyên liệu</h1>
        <p className="text-text-muted">
          {versionName(version)} · cho {session.servings} người. Mẹ chạm vào từng dòng khi đã chuẩn bị xong.
        </p>
        <div className="rounded-lg bg-surface-warm p-2">
          {ingredients.map((i) => (
            <IngredientRow key={i.slot} name={i.name} amount={formatAmount(i.quantity, i.unit)} metric={formatMetric(i.metricQuantity, i.metricUnit)} prepNote={i.prepNote} optional={i.optional} checked={session.checked.includes(i.slot)} onCheckedChange={(v) => toggleChecked(i.slot, v)} />
          ))}
        </div>
        <section className="flex flex-col gap-2">
          <h2 className="text-xl">Dụng cụ</h2>
          <ul className="flex list-disc flex-col gap-1 pl-7">
            {version.equipment.map((e) => (
              <li key={e.name}>{e.name}</li>
            ))}
          </ul>
        </section>
        <SpeakButton available={speech.available !== false} speaking={speech.speaking} onPress={() => (speech.speaking ? speech.stop() : speech.speak(ingredientsSpeech(version, session.servings)))} />
        {!wakeLockHeld && <Banner>Để màn hình không tự tắt khi nấu: vào Cài đặt của máy → Màn hình → Tự động khoá → Không.</Banner>}
        <Button size="lg" fullWidth icon={<ChevronRight aria-hidden className="size-7" />} onClick={() => goTo(1)}>
          Bắt đầu bước 1
        </Button>
        <Button variant="quiet" onClick={() => setAskAbandon(true)}>
          Bỏ lần nấu này
        </Button>
        <ConfirmDialog open={askAbandon} title="Bỏ lần nấu này?" confirmLabel="Bỏ lần nấu này" cancelLabel="Không, nấu tiếp" danger onCancel={() => setAskAbandon(false)} onConfirm={() => void abandonSession(session.id)}>
          <p>Lần nấu này sẽ không được ghi vào nhật ký.</p>
        </ConfirmDialog>
      </AppShell>
    );
  }

  // ── Nấu xong: feedback ──
  if (stepNo > total) {
    return <FinishForm header={header} session={session} recipe={recipe} onBack={() => goTo(total)} onFinished={onFinished} />;
  }

  // ── One step ──
  const step = version.steps[stepNo - 1];
  const used = step.uses.map((u) => ({ use: u, ing: ingredients.find((i) => i.slot === u.slot) })).filter((x) => x.ing);
  const hasTimer = step.timerSeconds != null && !session.timers.some((t) => t.stepNo === step.no);

  return (
    <AppShell tab="cooking">
      {header}
      <StepProgress current={stepNo} total={total} />
      {timersBar}
      <h1 className="text-display">{step.title}</h1>

      {used.length > 0 && (
        <section aria-label="Cần dùng ở bước này" className="rounded-lg bg-surface-warm p-2">
          <p className="px-3 pt-2 font-medium text-text-muted">Cần dùng</p>
          {used.map(({ use, ing }) => (
            <IngredientRow
              key={use.slot}
              name={ing!.name}
              amount={use.portion === 1 ? formatAmount(ing!.quantity, ing!.unit) : use.portion === 0.5 ? "một nửa" : `${Math.round(use.portion * 100)}%`}
              metric={use.portion === 1 ? formatMetric(ing!.metricQuantity, ing!.metricUnit) : undefined}
              prepNote={ing!.prepNote}
              optional={ing!.optional}
            />
          ))}
        </section>
      )}

      <ol className="flex list-decimal flex-col gap-4 pl-9 text-cook">
        {step.instructions.map((t, i) => (
          <li key={i}>{fillStepText(t, ingredients)}</li>
        ))}
      </ol>

      {step.doneWhen && <DoneWhen>{step.doneWhen}</DoneWhen>}
      {step.avoid && <Avoid>{step.avoid}</Avoid>}
      {step.ifWrong && <p className="rounded-md bg-surface p-4 text-lg font-normal shadow-card">{step.ifWrong}</p>}

      <div className="flex flex-wrap gap-3">
        {hasTimer && (
          <TimerButton
            minutes={Math.round(step.timerSeconds! / 60)}
            onStart={() => {
              unlockAudio();
              setTimers([...session.timers, createTimer(step.timerLabel ?? step.title, step.no, step.timerSeconds!, Date.now())]);
            }}
          />
        )}
        <SpeakButton available={speech.available !== false} speaking={speech.speaking} onPress={() => (speech.speaking ? speech.stop() : speech.speak(stepSpeech(version, step.no, session.servings)))} />
      </div>

      <div className="sticky bottom-18 z-10 -mx-4 border-t border-border bg-bg px-4 py-3 grid grid-cols-2 gap-3">
        <Button variant="secondary" size="lg" className="px-3 whitespace-nowrap" icon={<ChevronLeft aria-hidden className="size-7 shrink-0" />} onClick={() => goTo(stepNo - 1)}>
          Quay lại
        </Button>
        {stepNo < total ? (
          <Button size="lg" onClick={() => goTo(stepNo + 1)}>
            Tiếp theo
          </Button>
        ) : (
          <Button size="lg" icon={<Check aria-hidden className="size-7" />} onClick={() => goTo(total + 1)}>
            Nấu xong
          </Button>
        )}
      </div>
    </AppShell>
  );
}

function FinishForm({ header, session, recipe, onBack, onFinished }: { header: React.ReactNode; session: CookingSession; recipe: Recipe; onBack: () => void; onFinished: (f: Finished) => void }) {
  const [verdict, setVerdict] = useState<FeedbackId | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (rated: boolean) => {
    if (rated && !verdict) return;
    setSaving(true);
    setError(null);
    try {
      await finishSession(session.id, rated && verdict ? { verdict, note } : null);
      onFinished({ recipe, sessionId: session.id, verdict: rated ? verdict : null, approved: recipe.verification === "family_approved" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa lưu được. Mẹ thử lại nhé.");
      setSaving(false);
    }
  };

  return (
    <AppShell tab="cooking">
      {header}
      <h1 className="text-display">Gia đình mình thấy món ăn hôm nay thế nào?</h1>
      <FeedbackOptions value={verdict} onChange={setVerdict} />
      <label className="flex flex-col gap-2">
        <span className="text-lg">Ghi chú thêm (không bắt buộc)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} placeholder="Ví dụ: ba khen thơm, lần sau kho lâu hơn chút" className="rounded-md border-2 border-border-input bg-surface p-4 text-lg placeholder:text-text-muted" />
      </label>
      {error && <Banner kind="error">{error}</Banner>}
      {!verdict && <p className="text-text-muted">Mẹ chọn một ý ở trên rồi bấm Lưu. Không muốn nhận xét thì bấm “Xong, không ghi nhận xét”.</p>}
      <Button size="lg" fullWidth disabled={!verdict} loading={saving} onClick={() => void save(true)}>
        Lưu vào nhật ký
      </Button>
      <Button variant="secondary" fullWidth disabled={saving} onClick={() => void save(false)}>
        Xong, không ghi nhận xét
      </Button>
      <Button variant="quiet" onClick={onBack}>
        Quay lại bước cuối
      </Button>
    </AppShell>
  );
}

function AfterCooking({ finished, onChange }: { finished: Finished; onChange: (f: Finished | null) => void }) {
  const { recipe, verdict, sessionId } = finished;
  const good = verdict === "rat_ngon" || verdict === "vua_mieng";
  const rated = verdict != null;
  const reason = verdict === "hoi_man" ? "Bớt mặn" : verdict === "hoi_ngot" ? "Bớt ngọt" : "";
  const linkCls = "inline-flex min-h-target-lg items-center justify-center rounded-md px-6 text-lg font-semibold";
  return (
    <AppShell tab="cooking">
      <h1 className="text-display">Đã lưu vào nhật ký</h1>
      <p className="text-lg font-normal">{rated ? `${recipe.name}: ${VERDICT_LABELS[verdict]}.` : `${recipe.name}: đã nấu xong.`}</p>

      {good && recipe.verification !== "family_approved" && !finished.approved && (
        <section className="flex flex-col gap-3 rounded-lg bg-secondary-soft p-4">
          <p className="text-lg font-normal">Món hôm nay ngon. Mẹ có muốn ghi nhận cách nấu này là “Gia đình đã duyệt” không?</p>
          <Button onClick={() => void confirmFamilyApproved(recipe.id, sessionId).then(() => onChange({ ...finished, approved: true }))}>Có, nhà mình duyệt món này</Button>
        </section>
      )}
      {finished.approved && <Banner>Đã ghi nhận: gia đình đã duyệt món này.</Banner>}

      {rated && !good && (
        <section className="flex flex-col gap-3 rounded-lg bg-accent-soft p-4">
          <p className="text-lg font-normal">Mẹ có muốn chỉnh lại lượng gia vị cho lần sau không? Bản gốc vẫn được giữ nguyên.</p>
          <Link href={`/cong-thuc/chinh/?id=${recipe.id}&ly_do=${encodeURIComponent(reason)}&lan_nau=${sessionId}`} className={`${linkCls} bg-accent text-on-accent`}>
            Chỉnh cho lần sau
          </Link>
        </section>
      )}

      <Link href="/nhat-ky/" className={`${linkCls} border-2 border-border-input bg-surface`}>
        Xem nhật ký
      </Link>
      <Link href="/" className={`${linkCls} text-accent underline`}>
        Về trang chủ
      </Link>
    </AppShell>
  );
}
