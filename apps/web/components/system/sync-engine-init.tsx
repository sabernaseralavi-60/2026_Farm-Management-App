"use client";

import { useEffect } from "react";
import { initSyncEngine } from "@/lib/sync";

/** Mounted once in the root layout: starts the offline-first background sync
 * loop (retry on reconnect + periodic sweep). Renders nothing. */
export function SyncEngineInit() {
  useEffect(() => {
    initSyncEngine();
  }, []);
  return null;
}
