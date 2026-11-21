import { Pause, Play, Plus, Timer, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function TimerButton({ minutes, onStart }: { minutes: number; onStart?: () => void }) {
  return (
    <Button variant="secondary" icon={<Timer aria-hidden className="size-6" />} onClick={onStart}>
      Hẹn giờ {minutes} phút
    </Button>
  );
}

export type TimerState = "running" | "paused" | "finished";

/** Presentational: the countdown logic lives in features/cooking and passes the numbers in. */
export function TimerBar({
  label,
  remainingSeconds,
  state,
  onToggle,
  onAddMinute,
  onStop,
}: {
  label: string;
  remainingSeconds: number;
  state: TimerState;
  onToggle?: () => void;
  onAddMinute?: () => void;
  onStop?: () => void;
}) {
  const finished = state === "finished";
  return (
    <section
      aria-label={`Hẹn giờ: ${label}`}
      className={cn("rounded-lg border-2 p-4 shadow-card", finished ? "border-accent bg-accent text-on-accent" : "border-border bg-surface")}
    >
      <p className="text-lg font-medium">{finished ? `Hết giờ! ${label}` : label}</p>
      <p role="timer" aria-live="off" className="tabular text-timer">
        {formatClock(remainingSeconds)}
      </p>
      {state === "paused" && <p className="text-base">Đang tạm dừng</p>}
      <div className="mt-3 flex flex-wrap gap-3">
        {!finished && (
          <Button variant="secondary" onClick={onToggle} icon={state === "running" ? <Pause aria-hidden className="size-6" /> : <Play aria-hidden className="size-6" />}>
            {state === "running" ? "Tạm dừng" : "Tiếp tục"}
          </Button>
        )}
        <Button variant="secondary" onClick={onAddMinute} icon={<Plus aria-hidden className="size-6" />}>
          1 phút
        </Button>
        <Button variant="secondary" onClick={onStop} icon={<X aria-hidden className="size-6" />}>
          Tắt
        </Button>
      </div>
    </section>
  );
}
