"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./button";

/**
 * A question with two large answers. The safe answer is always the big primary button;
 * the action that changes or removes something is worded exactly ("Xoá món này").
 * Built on the native <dialog>, which traps focus and closes on Esc.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Không, giữ nguyên",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-surface p-6 text-text shadow-pop backdrop:bg-text/50"
    >
      <h2 className="text-xl">{title}</h2>
      {children && <div className="mt-3 flex flex-col gap-2 text-lg font-normal">{children}</div>}
      <div className="mt-6 flex flex-col gap-3">
        <Button size="lg" fullWidth onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? "danger" : "secondary"} fullWidth loading={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
