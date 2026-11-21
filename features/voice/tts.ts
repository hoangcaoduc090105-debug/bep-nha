"use client";

// Reading aloud in Vietnamese with the browser's own speech synthesis. No service involved.
// Whether a Vietnamese voice exists depends on the device, so it is detected, never assumed.

import { useCallback, useEffect, useState } from "react";
import { isBetterVoice, speechChunks, vietnameseVoices } from "./text";

function findVietnameseVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return vietnameseVoices(window.speechSynthesis.getVoices());
}

export type Speech = {
  /** null while the voice list is still loading. */
  available: boolean | null;
  speaking: boolean;
  /** The voice in use, and whether it is one of the better-sounding kinds. */
  voiceName: string | null;
  betterVoice: boolean;
  /** Every Vietnamese voice the device offers to the app, best first. */
  voices: SpeechSynthesisVoice[];
  speak: (text: string) => void;
  stop: () => void;
};

/** `preferredURI` is the voice she chose in Cài đặt; without it (or if it is gone) the best one is used. */
export function useSpeech(rate = 0.9, preferredURI: string | null = null): Speech {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[] | undefined>(undefined);
  const voice = voices === undefined ? undefined : (voices.find((v) => v.voiceURI === preferredURI) ?? voices[0] ?? null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      const t = setTimeout(() => setVoices([]), 0);
      return () => clearTimeout(t);
    }
    const synth = window.speechSynthesis;
    const load = () => setVoices(findVietnameseVoices());
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
      // One utterance per sentence: the voice pauses between them, which is far easier to follow.
      const chunks = speechChunks(text);
      if (chunks.length === 0) return;
      setSpeaking(true);
      chunks.forEach((chunk, i) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.voice = voice;
        u.lang = voice.lang;
        u.rate = rate;
        if (i === chunks.length - 1) u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
        synth.speak(u);
      });
    },
    [voice, rate],
  );

  return { available: voice === undefined ? null : voice !== null, speaking, voiceName: voice?.name ?? null, betterVoice: voice ? isBetterVoice(voice) : false, voices: voices ?? [], speak, stop };
}
