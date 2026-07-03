"use client";

// Tiny pub/sub so lib/sync.ts (network layer) can tell lib/store.ts
// (in-memory Zustand caches) that a record finished syncing, without the two
// modules importing each other's internals.
export const syncBus = new EventTarget();

export interface RecordSyncedDetail {
  module: string;
  uid: string;
}

export function emitRecordSynced(detail: RecordSyncedDetail) {
  syncBus.dispatchEvent(new CustomEvent<RecordSyncedDetail>("record-synced", { detail }));
}

export function onRecordSynced(cb: (detail: RecordSyncedDetail) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<RecordSyncedDetail>).detail);
  syncBus.addEventListener("record-synced", handler);
  return () => syncBus.removeEventListener("record-synced", handler);
}
