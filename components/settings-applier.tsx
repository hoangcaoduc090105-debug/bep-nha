"use client";

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getSetting } from "@/data/repo";
import { DEFAULTS, type TextScale } from "@/lib/settings";

/** Applies the saved text size to the whole app, and asks the browser to keep our data. */
export function SettingsApplier() {
  const scale = useLiveQuery(() => getSetting<TextScale>("textScale", DEFAULTS.textScale), []);
  useEffect(() => {
    if (scale) document.documentElement.setAttribute("data-text-scale", scale);
  }, [scale]);
  useEffect(() => {
    // Ask once per visit. Browsers decide by themselves (Safari grants it to Home Screen apps).
    void navigator.storage?.persist?.().catch(() => false);
  }, []);
  return null;
}
