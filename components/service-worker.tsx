"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Registers the service worker that makes the app work offline (production builds only),
 * and offers a one-tap update when a newer version has been downloaded.
 */
export function ServiceWorker() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let alive = true;
    const watch = (reg: ServiceWorkerRegistration) => {
      const offer = () => {
        // "waiting" with an active controller means: a newer version is ready.
        if (alive && reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      };
      offer();
      reg.addEventListener("updatefound", () => reg.installing?.addEventListener("statechange", offer));
    };
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).then(watch).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (!waiting) return null;
  const update = () => {
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    waiting.postMessage("skip-waiting");
  };
  return (
    <div role="status" className="sticky top-0 z-20 flex flex-wrap items-center justify-center gap-3 bg-surface-warm p-3 text-base">
      <span>Bếp Nhà có bản mới.</span>
      <Button variant="secondary" onClick={update}>
        Cập nhật
      </Button>
    </div>
  );
}
