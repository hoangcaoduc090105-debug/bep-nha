"use client";

// Reading aloud in Vietnamese with the browser's own speech synthesis. No service involved.
// Whether a Vietnamese voice exists depends on the device, so it is detected, never assumed.

import { useCallback, useEffect, useState } from "react";

function findVietnameseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith("vi")) ?? null;
}

export type Speech = {
  /** null while the voice list is still loading. */
  available: boolean | null;
  speaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
};

export function useSpeech(rate = 0.9): Speech {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null | undefined>(undefined);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      const t = setTimeout(() => setVoice(null), 0);
      return () => clearTimeout(t);
    }
    const synth = window.speechSynthesis;
    const load = () => setVoice(findVietnameseVoice());
    // Voices arrive asynchronously on most browsers. If none has appeared after a moment,
    // conclude that this device has no Vietnamese voice.
    const first = setTimeout(load, 0);
    const giveUp = setTimeout(load, 1500);
    synth.addEventListener("voiceschanged", load);
    return () => {
      clearTimeout(first);
      clearTimeout(giveUp);
      synth.removeEventListener("voiceschanged", load);
      synth.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!voice) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = rate;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      setSpeaking(true);
      synth.speak(u);
    },
    [voice, rate],
  );

  return { available: voice === undefined ? null : voice !== null, speaking, speak, stop };
}
