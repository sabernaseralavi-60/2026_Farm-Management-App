"use client";

import { useEffect } from "react";
import { initPhotoUploadEngine } from "@/lib/photo-upload";
import { initSyncEngine } from "@/lib/sync";

/** Mounted once in the root layout: starts the offline-first background sync
 * loop (retry on reconnect + periodic sweep) — records and queued photos
 * alike. Renders nothing. */
export function SyncEngineInit() {
  useEffect(() => {
    initSyncEngine();
    initPhotoUploadEngine();
  }, []);
  return null;
}
