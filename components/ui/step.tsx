import { CircleCheck, TriangleAlert } from "lucide-react";

/** "Bước 3 / 8" with a progress bar. */
export function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-lg text-text-muted">
        Bước <span className="tabular text-text">{current}</span> / <span className="tabular">{total}</span>
      </p>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`Bước ${current} trên ${total}`}
        className="h-3 overflow-hidden rounded-pill bg-surface-warm"
      >
        <div className="h-full rounded-pill bg-secondary" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

/** What to see, smell or hear when the step is done. Meaning is in the words, not the colour. */
export function DoneWhen({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-3 rounded-md bg-secondary-soft p-4 text-lg font-normal">
      <CircleCheck aria-hidden className="mt-0.5 size-7 shrink-0 text-secondary" />
      <span>
        <strong className="font-semibold">Được khi:</strong> {children}
      </span>
    </p>
  );
}

/** The usual mistake at this step. */
export function Avoid({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-3 rounded-md bg-warning-bg p-4 text-lg font-normal">
      <TriangleAlert aria-hidden className="mt-0.5 size-7 shrink-0" />
      <span>
        <strong className="font-semibold">Tránh:</strong> {children}
      </span>
    </p>
  );
}
