"use client";

import { useEffect } from "react";

/** Registers the app-shell service worker so the PWA can still load (not
 * just still store data) when the farm has no signal. */
export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline-first data entry still works via Dexie even if the SW
        // fails to register (e.g. unsupported browser) — this is best-effort.
      });
    }
  }, []);
  return null;
}
