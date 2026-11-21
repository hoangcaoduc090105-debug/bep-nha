"use client";

import { useEffect, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { TabBar, type TabId } from "@/components/ui/tab-bar";
import { ensureSeeded, getActiveSession } from "@/data/repo";

/** Page frame: content column plus the five-tab bar. Loads the sample recipes on first run. */
export function AppShell({ tab, children }: { tab: TabId; children: ReactNode }) {
  useEffect(() => {
    void ensureSeeded();
  }, []);
  const active = useLiveQuery(() => getActiveSession(), []);
  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pb-8 pt-6">{children}</main>
      <TabBar current={tab} cookingStep={active ? Math.max(1, active.currentStep) : undefined} className="sticky bottom-0 z-10" />
    </>
  );
}
