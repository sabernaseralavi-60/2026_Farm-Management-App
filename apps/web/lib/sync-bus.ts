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

/** Same idea, for lib/photo-upload.ts → components/ui/photo-picker.tsx: lets
 * an open form learn the moment its own queued photo finishes uploading,
 * without polling. `id` is the PendingPhoto row id, so a picker with
 * several photos queued for the same record can tell them apart. */
export interface PhotoUploadedDetail {
  id: string;
  module: string;
  uid: string;
  url: string;
}

export function emitPhotoUploaded(detail: PhotoUploadedDetail) {
  syncBus.dispatchEvent(new CustomEvent<PhotoUploadedDetail>("photo-uploaded", { detail }));
}

export function onPhotoUploaded(cb: (detail: PhotoUploadedDetail) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<PhotoUploadedDetail>).detail);
  syncBus.addEventListener("photo-uploaded", handler);
  return () => syncBus.removeEventListener("photo-uploaded", handler);
}
