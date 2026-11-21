import { describe, expect, it } from "vitest";
import { addSeconds, createTimer, pauseTimer, remaining, resumeTimer, timerState } from "@/features/cooking/timers";

describe("cooking timers", () => {
  const t0 = 1_000_000;
  it("counts down from an end time, so a locked phone does not make it drift", () => {
    const t = createTimer("Kho cá", 5, 120, t0);
    expect(remaining(t, t0)).toBe(120);
    expect(remaining(t, t0 + 61_000)).toBe(59);
    expect(timerState(t, t0 + 61_000)).toBe("running");
    // The phone was locked for ten minutes: on return the timer is simply finished.
    expect(remaining(t, t0 + 600_000)).toBe(0);
    expect(timerState(t, t0 + 600_000)).toBe("finished");
  });
  it("pauses and resumes without losing time", () => {
    const paused = pauseTimer(createTimer("Ướp", 2, 900, t0), t0 + 100_000);
    expect(timerState(paused, t0 + 500_000)).toBe("paused");
    expect(remaining(paused, t0 + 500_000)).toBe(800);
    const resumed = resumeTimer(paused, t0 + 500_000);
    expect(remaining(resumed, t0 + 560_000)).toBe(740);
  });
  it("adds a minute, also after it rang", () => {
    const t = createTimer("Kho", 5, 60, t0);
    expect(remaining(addSeconds(t, 60, t0 + 10_000), t0 + 10_000)).toBe(110);
    expect(remaining(addSeconds(t, 60, t0 + 300_000), t0 + 300_000)).toBe(60);
    expect(remaining(addSeconds(pauseTimer(t, t0 + 10_000), 60, t0 + 20_000), t0 + 20_000)).toBe(110);
  });
});
