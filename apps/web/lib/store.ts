"use client";

import { create, type StoreApi, type UseBoundStore } from "zustand";
import { MODULE_KEYS, tableFor } from "./db";
import { queueSync } from "./sync";
import { onRecordSynced } from "./sync-bus";
import type { AnyRecord, ModuleKey, Synced } from "./types";

interface ModuleState<T extends Synced> {
  rows: T[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (rec: T) => Promise<void>;
  update: (rec: T) => Promise<void>;
  remove: (uid: string) => Promise<void>;
}

type ModuleStoreHook<T extends Synced> = UseBoundStore<StoreApi<ModuleState<T>>>;

const cache = new Map<ModuleKey, ModuleStoreHook<Synced>>();

// One-time global subscription: whenever the sync engine confirms a record
// reached the server, patch that row's `synced` flag in whichever module
// store already has it cached in memory (Dexie was already updated by sync.ts).
if (typeof window !== "undefined") {
  onRecordSynced(({ module, uid }) => {
    const hook = cache.get(module as ModuleKey);
    if (!hook) return;
    const { rows } = hook.getState();
    hook.setState({
      rows: rows.map((r) => (r.uid === uid ? { ...r, synced: true } : r)),
    });
  });
}

/** One Dexie-backed Zustand store per module, built from a single shared
 * implementation so all 10 operational modules behave identically for
 * create/edit/delete + offline persistence + sync-on-write. */
export function useModuleStore<T extends Synced>(module: ModuleKey): ModuleStoreHook<T> {
  if (!cache.has(module)) {
    const table = tableFor(module);
    const hook: ModuleStoreHook<Synced> = create<ModuleState<Synced>>((set, get) => ({
      rows: [],
      loaded: false,
      load: async () => {
        const rows = (await table.toArray()) as Synced[];
        set({ rows, loaded: true });
      },
      add: async (rec: Synced) => {
        await table.put(rec as unknown as AnyRecord);
        set({ rows: [...get().rows, rec] });
        queueSync(module, rec);
      },
      update: async (rec: Synced) => {
        await table.put(rec as unknown as AnyRecord);
        set({ rows: get().rows.map((r) => (r.uid === rec.uid ? rec : r)) });
        queueSync(module, rec);
      },
      remove: async (uid: string) => {
        await table.delete(uid);
        set({ rows: get().rows.filter((r) => r.uid !== uid) });
      },
    }));
    cache.set(module, hook);
  }
  return cache.get(module) as unknown as ModuleStoreHook<T>;
}

export async function pendingSyncCount(): Promise<number> {
  let total = 0;
  for (const m of MODULE_KEYS) {
    const rows = (await tableFor(m).toArray()) as Synced[];
    total += rows.filter((r) => !r.synced).length;
  }
  return total;
}
