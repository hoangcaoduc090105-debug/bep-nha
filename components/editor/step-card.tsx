"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ListPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import type { FormIngredient, FormStep, Ingredient } from "@/data/types";
import { displayName, fixedAmounts, forbiddenAmounts, fromFriendly, toFriendly } from "@/features/editor/form";
import { fillStepText } from "@/features/recipe-text";
import { Card, TextArea, TextField } from "./fields";

const HEATS: Array<{ id: NonNullable<FormStep["heat"]>; label: string }> = [
  { id: "low", label: "Lửa nhỏ" },
  { id: "medium", label: "Lửa vừa" },
  { id: "high", label: "Lửa lớn" },
  { id: "off", label: "Tắt bếp" },
];

/**
 * One cooking step. Amounts are never typed into the text: an ingredient is inserted with
 * the button and shows as [tên]; the preview underneath shows the sentence as it will be
 * read when cooking, with the amount for the chosen number of servings.
 */
export function StepCard({
  index,
  count,
  value,
  ingredients,
  steps,
  onChange,
  onRemove,
  onMove,
}: {
  index: number;
  count: number;
  value: FormStep;
  ingredients: FormIngredient[];
  /** All steps of the recipe, to know which ingredients are already inserted somewhere. */
  steps: FormStep[];
  onChange: (v: FormStep) => void;
  onRemove: () => void;
  onMove: (by: -1 | 1) => void;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const [inserting, setInserting] = useState(false);
  // Where the cursor must go once the text with the inserted ingredient is on screen.
  const caretAfterInsert = useRef<number | null>(null);
  useLayoutEffect(() => {
    const at = caretAfterInsert.current;
    if (at == null) return;
    caretAfterInsert.current = null;
    area.current?.focus();
    area.current?.setSelectionRange(at, at);
  });
  const n = index + 1;
  const named = ingredients.filter((i) => i.name.trim());
  const friendly = toFriendly(value.text, ingredients);
  const preview = value.text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => fillStepText(l, named as unknown as Ingredient[]));
  const typed = fixedAmounts(value.text, ingredients);
  const forbidden = forbiddenAmounts(value, { steps, ingredients });

  const insert = (ing: FormIngredient) => {
    const el = area.current;
    const at = el ? el.selectionStart : friendly.length;
    const end = el ? el.selectionEnd : friendly.length;
    const before = friendly.slice(0, at);
    const word = `[${displayName(ing)}]`;
    const pad = before !== "" && !/\s$/.test(before) ? " " : "";
    const next = `${before}${pad}${word}${friendly.slice(end)}`;
    onChange({ ...value, text: fromFriendly(next, ingredients) });
    setInserting(false);
    caretAfterInsert.current = before.length + pad.length + word.length;
  };

  return (
    <Card
      title={`Bước ${n}${value.title.trim() ? `: ${value.title.trim()}` : ""}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={index === 0} aria-label={`Đưa bước ${n} lên trên`} icon={<ArrowUp aria-hidden className="size-6" />} onClick={() => onMove(-1)}>
            Lên
          </Button>
          <Button variant="secondary" disabled={index === count - 1} aria-label={`Đưa bước ${n} xuống dưới`} icon={<ArrowDown aria-hidden className="size-6" />} onClick={() => onMove(1)}>
            Xuống
          </Button>
          <Button variant="quiet" className="text-danger" aria-label={`Bỏ bước ${n}`} icon={<Trash2 aria-hidden className="size-6" />} onClick={onRemove}>
            Bỏ
          </Button>
        </div>
      }
    >
      <TextField label={`Tên bước ${n}`} value={value.title} maxLength={80} placeholder="Ví dụ: Ướp cá" onChange={(v) => onChange({ ...value, title: v })} />

      <TextArea
        label={`Cách làm bước ${n}`}
        hint="Mỗi dòng một việc. Không gõ số lượng: bấm “Chèn nguyên liệu” để lượng tự đổi theo số người ăn."
        rows={4}
        textareaRef={area}
        value={friendly}
        placeholder="Ví dụ: Cho cá vào tô."
        onChange={(v) => onChange({ ...value, text: fromFriendly(v, ingredients) })}
      />
      <Button variant="secondary" className="self-start" aria-expanded={inserting} disabled={named.length === 0} icon={<ListPlus aria-hidden className="size-6" />} onClick={() => setInserting(!inserting)}>
        {inserting ? "Đóng danh sách" : "Chèn nguyên liệu"}
      </Button>
      {named.length === 0 && <p className="text-text-muted">Mẹ nhập nguyên liệu ở phần 2 trước, rồi mới chèn vào đây được.</p>}
      {inserting && (
        <div role="group" aria-label={`Chọn nguyên liệu để chèn vào bước ${n}`} className="flex flex-wrap gap-3 rounded-md bg-surface-warm p-3">
          {named.map((i) => (
            <Chip key={i.slot} onClick={() => insert(i)}>
              {displayName(i)}
            </Chip>
          ))}
        </div>
      )}
      {forbidden.length > 0 ? (
        <p role="alert" className="rounded-md border-2 border-danger p-3">
          Câu này đang ghi cứng “{forbidden[0].text}”. Mẹ xoá số đó rồi bấm “Chèn nguyên liệu”.
        </p>
      ) : (
        typed.length > 0 && <p className="rounded-md bg-warning-bg p-3">“{typed[0].text}” là số gõ tay nên sẽ không đổi theo số người ăn. Nếu đây là lượng chính của món, mẹ dùng “Chèn nguyên liệu”.</p>
      )}
      {preview.length > 0 && (
        <div className="rounded-md bg-surface-warm p-3">
          <p className="text-sm text-text-muted">Khi nấu sẽ hiện:</p>
          <ul className="flex list-disc flex-col gap-1 pl-6" data-testid={`xem-truoc-${n}`}>
            {preview.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}

      <TextField label="Được khi… (dấu hiệu nhận biết đã xong)" value={value.doneWhen} maxLength={300} placeholder="Ví dụ: cá săn lại, áo màu nâu vàng." onChange={(v) => onChange({ ...value, doneWhen: v })} />
      <TextField label="Tránh… (lỗi hay gặp ở bước này)" value={value.avoid} maxLength={300} placeholder="Ví dụ: đảo nhiều — cá sẽ nát." onChange={(v) => onChange({ ...value, avoid: v })} />

      <div className="flex flex-col gap-2">
        <Chip className="self-start" selected={value.timerMinutes != null} onClick={() => onChange({ ...value, timerMinutes: value.timerMinutes == null ? 5 : null })}>
          Bước này cần hẹn giờ
        </Chip>
        {value.timerMinutes != null && (
          <>
            <QuantityStepper name={`phút hẹn giờ bước ${n}`} value={value.timerMinutes} unit="phút" step={value.timerMinutes >= 30 ? 5 : 1} min={1} max={360} onChange={(m) => onChange({ ...value, timerMinutes: Math.round(m) })} />
            <TextField label="Tên chuông (không bắt buộc)" value={value.timerLabel} maxLength={60} placeholder="Ví dụ: Kho cá lửa nhỏ" onChange={(v) => onChange({ ...value, timerLabel: v })} />
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-medium">Lửa (không bắt buộc)</p>
        <div role="group" aria-label={`Mức lửa bước ${n}`} className="flex flex-wrap gap-3">
          {HEATS.map((h) => (
            <Chip key={h.id} selected={value.heat === h.id} onClick={() => onChange({ ...value, heat: value.heat === h.id ? null : h.id })}>
              {h.label}
            </Chip>
          ))}
        </div>
      </div>
    </Card>
  );
}
