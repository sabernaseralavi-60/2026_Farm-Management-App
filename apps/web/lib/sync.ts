"use client";

import { db, MODULE_KEYS, tableFor } from "./db";
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

async function deleteOnServer(moduleKey: ModuleKey, uid: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${moduleKey}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Delete a record locally AND make sure the server eventually finds out.
 * The local table row is already gone by the time this is called (see
 * lib/store.ts) — this only owns getting the delete to Postgres, with the
 * same "never lose the intent" guarantee as queueSync has for writes. */
export function queueDelete(moduleKey: ModuleKey, uid: string) {
  const id = `${moduleKey}:${uid}`;
  void (async () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      await db.pendingDeletes.put({ id, module: moduleKey, uid });
      return;
    }
    const ok = await deleteOnServer(moduleKey, uid);
    if (ok) {
      await db.pendingDeletes.delete(id);
    } else {
      await db.pendingDeletes.put({ id, module: moduleKey, uid });
    }
  })();
}

/** Flush every delete that hasn't been confirmed on the server yet. Called
 * alongside syncPendingAll on the same triggers (reconnect + periodic sweep)
 * so a delete made while offline isn't stuck forever. */
export async function syncPendingDeletes(): Promise<{ done: number; fail: number }> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { done: 0, fail: 0 };
  let done = 0;
  let fail = 0;
  const pending = await db.pendingDeletes.toArray();
  for (const p of pending) {
    const ok = await deleteOnServer(p.module, p.uid);
    if (ok) {
      await db.pendingDeletes.delete(p.id);
      done += 1;
    } else {
      fail += 1;
    }
  }
  return { done, fail };
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

/** Sweep every module for unsynced rows (and pending deletes) and retry them.
 * Safe to call often — already-synced rows are skipped and idempotent
 * upserts/deletes make retries harmless. */
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
    const deletes = await syncPendingDeletes();
    done += deletes.done;
    fail += deletes.fail;
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
