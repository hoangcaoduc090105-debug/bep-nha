// Pure timer arithmetic. A running timer stores the moment it ends, not a countdown, so it
// is still right after the phone was locked or the app was in the background.

import type { SessionTimer } from "@/data/types";
import { newId } from "@/lib/text";

export function createTimer(label: string, stepNo: number, durationSeconds: number, now: number): SessionTimer {
  return { id: newId(), label, stepNo, durationSeconds, endsAt: now + durationSeconds * 1000, remainingSeconds: null };
}

export function remaining(t: SessionTimer, now: number): number {
  if (t.endsAt == null) return t.remainingSeconds ?? 0;
  return Math.max(0, Math.ceil((t.endsAt - now) / 1000));
}

export function timerState(t: SessionTimer, now: number): "running" | "paused" | "finished" {
  if (t.endsAt == null) return "paused";
  return t.endsAt <= now ? "finished" : "running";
}

export function pauseTimer(t: SessionTimer, now: number): SessionTimer {
  if (t.endsAt == null) return t;
  return { ...t, endsAt: null, remainingSeconds: remaining(t, now) };
}

export function resumeTimer(t: SessionTimer, now: number): SessionTimer {
  if (t.endsAt != null) return t;
  return { ...t, endsAt: now + (t.remainingSeconds ?? 0) * 1000, remainingSeconds: null };
}

export function addSeconds(t: SessionTimer, seconds: number, now: number): SessionTimer {
  if (t.endsAt == null) return { ...t, remainingSeconds: (t.remainingSeconds ?? 0) + seconds };
  // A timer that already rang restarts from now.
  return { ...t, endsAt: Math.max(t.endsAt, now) + seconds * 1000 };
}
