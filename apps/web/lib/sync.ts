"use client";

import { MODULE_KEYS, tableFor } from "./db";
import { emitRecordSynced } from "./sync-bus";
import type { AnyRecord, ModuleKey, Synced } from "./types";

// ===== Offline-first cloud sync =====
// The device's IndexedDB copy (via Dexie) is written FIRST and is always
// authoritative — nothing here ever removes or blocks on network data. Every
// record carries a client-generated `uid`, so POSTing the same record twice
// (e.g. a retry after a dropped connection) is a no-op upsert on the server,
// never a duplicate row.

let attemptInFlight = false;

async function postRecord(moduleKey: ModuleKey, record: Synced): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${moduleKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Fire-and-forget: try to sync one record right after it's saved locally. */
export function queueSync(moduleKey: ModuleKey, record: Synced) {
  if (record.synced) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  void (async () => {
    const ok = await postRecord(moduleKey, record);
    if (ok) {
      const updated = { ...record, synced: true };
      await tableFor(moduleKey).put(updated as unknown as AnyRecord);
      emitRecordSynced({ module: moduleKey, uid: record.uid });
    }
  })();
}

/** Sweep every module for unsynced rows and retry them. Safe to call often —
 * already-synced rows are skipped and idempotent upserts make retries harmless. */
export async function syncPendingAll(): Promise<{ done: number; fail: number }> {
  if (attemptInFlight) return { done: 0, fail: 0 };
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { done: 0, fail: 0 };
  attemptInFlight = true;
  let done = 0;
  let fail = 0;
  try {
    for (const moduleKey of MODULE_KEYS) {
      const table = tableFor(moduleKey);
      const rows = (await table.toArray()) as Synced[];
      const pending = rows.filter((r) => !r.synced);
      for (const record of pending) {
        const ok = await postRecord(moduleKey, record);
        if (ok) {
          const updated = { ...record, synced: true };
          await table.put(updated as unknown as AnyRecord);
          emitRecordSynced({ module: moduleKey, uid: record.uid });
          done += 1;
        } else {
          fail += 1;
        }
      }
    }
  } finally {
    attemptInFlight = false;
  }
  return { done, fail };
}

let engineStarted = false;

/** Call once from a client root component. Retries pending records whenever
 * the browser regains connectivity, plus a periodic safety-net sweep. */
export function initSyncEngine() {
  if (engineStarted || typeof window === "undefined") return;
  engineStarted = true;
  window.addEventListener("online", () => void syncPendingAll());
  void syncPendingAll();
  window.setInterval(() => void syncPendingAll(), 60_000);
}
