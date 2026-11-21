import { LoaderCircle, Mic, MicOff, Square, Volume2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export type MicState = "idle" | "listening" | "processing" | "understood" | "not_understood" | "unavailable";

const STATUS: Record<Exclude<MicState, "understood" | "unavailable">, string> = {
  idle: "Bấm để nói",
  listening: "Đang nghe…",
  processing: "Đang xử lý…",
  not_understood: "Chưa nghe rõ, mẹ bấm nút bên dưới nhé",
};

/**
 * The microphone always says what it is doing, in words. When the device cannot recognise
 * speech it is replaced by an explanation — never left as a button that does nothing.
 */
export function MicButton({ state, heard, onPress }: { state: MicState; heard?: string; onPress?: () => void }) {
  if (state === "unavailable") {
    return (
      <div className="flex items-center gap-3 rounded-md bg-surface-warm p-4 text-base">
        <MicOff aria-hidden className="size-7 shrink-0 text-text-muted" />
        <p>Máy này chưa dùng được lệnh bằng giọng nói. Mẹ bấm các nút lớn bên dưới nhé.</p>
      </div>
    );
  }
  const text = state === "understood" ? `Đã hiểu: “${heard ?? ""}”` : STATUS[state];
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onPress}
        aria-pressed={state === "listening"}
        aria-label="Nói lệnh"
        className={cn(
          "flex size-(--spacing-target-mic) items-center justify-center rounded-pill border-4",
          state === "listening" ? "border-accent bg-accent text-on-accent" : "border-accent bg-surface text-accent",
        )}
      >
        {state === "processing" ? <LoaderCircle aria-hidden className="size-10 animate-spin" /> : <Mic aria-hidden className="size-10" />}
      </button>
      <p aria-live="polite" className={cn("text-center text-base font-medium", state === "not_understood" && "text-danger")}>
        {text}
      </p>
    </div>
  );
}

export function SpeakButton({ speaking, available = true, onPress }: { speaking?: boolean; available?: boolean; onPress?: () => void }) {
  if (!available) {
    return <p className="rounded-md bg-surface-warm p-4 text-base">Máy này chưa đọc được tiếng Việt.</p>;
  }
  return (
    <Button variant="secondary" onClick={onPress} icon={speaking ? <Square aria-hidden className="size-6" /> : <Volume2 aria-hidden className="size-6" />}>
      {speaking ? "Dừng đọc" : "Đọc"}
    </Button>
  );
}
