// The timer alarm: three short beeps and a vibration where the phone supports it.
// Browsers only allow sound after the user has tapped something, so the audio context is
// created on the first tap in cooking mode (unlockAudio).

let ctx: AudioContext | null = null;

export function unlockAudio(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    // No audio on this device; the alarm stays visual.
  }
}

export function ringAlarm(): void {
  try {
    navigator.vibrate?.([300, 150, 300, 150, 300]);
  } catch {
    /* vibration is optional */
  }
  if (!ctx) return;
  const start = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, start + i * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.4, start + i * 0.5 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.5 + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start + i * 0.5);
    osc.stop(start + i * 0.5 + 0.4);
  }
}
