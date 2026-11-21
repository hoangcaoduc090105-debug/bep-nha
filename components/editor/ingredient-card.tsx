"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import type { FormIngredient, Unit } from "@/data/types";
import { UNIT_CHOICES, unitLabel } from "@/features/editor/form";
import { stepForUnit } from "@/lib/quantity";
import { AmountInput } from "./amount-input";
import { Card, TextField } from "./fields";

/** One ingredient or seasoning: name, amount, unit, how to prepare it. */
export function IngredientCard({ index, value, onChange, onRemove }: { index: number; value: FormIngredient; onChange: (v: FormIngredient) => void; onRemove: () => void }) {
  const [pickingUnit, setPickingUnit] = useState(false);
  const noun = value.kind === "seasoning" ? "gia vị" : "nguyên liệu";
  const name = value.name.trim() || `${noun} ${index + 1}`;
  const aLittle = value.unit === "it";
  const pick = (unit: Unit) => {
    // Coming back from "một ít", or to a unit where the old number makes no sense, start from 1.
    onChange({ ...value, unit, quantity: unit === "it" ? null : (value.quantity ?? 1) });
    setPickingUnit(false);
  };
  return (
    <Card
      title={value.name.trim() || `${noun.charAt(0).toUpperCase()}${noun.slice(1)} ${index + 1}`}
      actions={
        <Button variant="quiet" className="text-danger" icon={<Trash2 aria-hidden className="size-6" />} aria-label={`Bỏ ${name}`} onClick={onRemove}>
          Bỏ
        </Button>
      }
    >
      <TextField label={`Tên ${noun}`} value={value.name} maxLength={80} placeholder={value.kind === "seasoning" ? "Ví dụ: Nước mắm" : "Ví dụ: Thịt ba chỉ"} onChange={(v) => onChange({ ...value, name: v })} />

      {!aLittle && (
        <AmountInput name={name.toLowerCase()} value={value.quantity} unit={value.unit} step={stepForUnit(value.unit, value.quantity ?? 0)} max={100000} onChange={(q) => onChange({ ...value, quantity: q })} />
      )}

      <div className="flex flex-col gap-2">
        <p className="font-medium">Đơn vị</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xl">{aLittle ? "Một ít, vừa ăn (không đong)" : value.unit ? unitLabel(value.unit) : "Chưa chọn"}</span>
          <Button variant="secondary" aria-expanded={pickingUnit} aria-label={`Đổi đơn vị của ${name}`} onClick={() => setPickingUnit(!pickingUnit)}>
            {pickingUnit ? "Đóng" : "Đổi đơn vị"}
          </Button>
        </div>
        {pickingUnit && (
          <div role="group" aria-label={`Chọn đơn vị cho ${name}`} className="flex flex-wrap gap-3 rounded-md bg-surface-warm p-3">
            {UNIT_CHOICES.map((u) => (
              <Chip key={u} selected={value.unit === u} onClick={() => pick(u)}>
                {unitLabel(u)}
              </Chip>
            ))}
            <Chip selected={aLittle} onClick={() => pick("it")}>
              Một ít, vừa ăn (không đong)
            </Chip>
          </div>
        )}
      </div>

      <TextField label="Sơ chế (không bắt buộc)" value={value.prepNote} maxLength={120} placeholder="Ví dụ: băm nhỏ" onChange={(v) => onChange({ ...value, prepNote: v })} />
      <Chip className="self-start" selected={value.optional} onClick={() => onChange({ ...value, optional: !value.optional })}>
        Có thì thêm, không có cũng được
      </Chip>
    </Card>
  );
}
