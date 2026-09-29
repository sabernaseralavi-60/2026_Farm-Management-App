"use client";

// Offline-first photo upload queue — mirrors lib/sync.ts's pattern
// (compress → queue in IndexedDB → best-effort send now → retried by the
// same engine on reconnect/interval) so a photo taken with no signal is
// never lost, just delayed.

import { db, tableFor } from "./db";
import { compressImage } from "./image-compress";
import { genUid } from "./reference-data";
import { queueSync } from "./sync";
import { emitPhotoUploaded } from "./sync-bus";
import type { AnyRecord, ModuleKey, Synced } from "./types";

let uploadInFlight = false;

async function postPhoto(module: ModuleKey, uid: string, blob: Blob, mime: string): Promise<string | null> {
  try {
    const ext = mime === "image/webp" ? "webp" : "jpg";
    const res = await fetch(`/api/photos/upload?module=${module}&uid=${encodeURIComponent(uid)}&ext=${ext}`, {
      method: "POST",
      headers: { "Content-Type": mime },
      body: blob,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok: boolean; url?: string };
    return data.ok && data.url ? data.url : null;
  } catch {
    return null;
  }
}

export interface QueuedPhoto {
  id: string;
  /** Local object URL for an instant preview — revoke it when done with it. */
  previewUrl: string;
}

/** Compresses `file` and queues it against `module`/`uid` (the owning
 * record — see the module pages for how `uid` is assigned up front so this
 * works even before the record's first save). Kicks off an upload attempt
 * immediately if online; either way the photo is durable in IndexedDB from
 * this point on. Returns right away with a local preview URL — watch for
 * `onPhotoUploaded` (lib/sync-bus.ts) with this `id` to know when it's live. */
export async function queuePhotoUpload(module: ModuleKey, uid: string, file: File): Promise<QueuedPhoto> {
  const { blob, mimeType } = await compressImage(file);
  const id = genUid();
  await db.pendingPhotos.put({ id, module, uid, blob, mime: mimeType, createdAt: Date.now() });
  void uploadPendingPhotos();
  return { id, previewUrl: URL.createObjectURL(blob) };
}

export async function pendingPhotosFor(module: ModuleKey, uid: string) {
  return db.pendingPhotos.where({ module, uid }).toArray();
}

export async function removePendingPhoto(id: string): Promise<void> {
  const p = await db.pendingPhotos.get(id);
  if (p?.uploadedUrl) {
    // Already made it to Blob storage — reclaim it rather than leaving an
    // orphan file behind. Best-effort: a failure here just leaves an unused
    // file, never blocks the user from cancelling.
    void fetch("/api/photos/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: p.uploadedUrl }),
    }).catch(() => {});
  }
  await db.pendingPhotos.delete(id);
}

/** Flushes every queued photo: uploads any that haven't reached Blob
 * storage yet, then — for every uploaded photo, including ones left over
 * from a previous sweep whose record didn't exist yet at the time — tries
 * to attach the URL to the owning record's `photos` (both locally and via
 * the normal record sync) and drops it from the queue. Safe to call often:
 * already-uploading is guarded, uploading never repeats once
 * `uploadedUrl` is set, and a record that still doesn't exist just gets
 * retried on the next sweep instead of dropping the photo. */
export async function uploadPendingPhotos(): Promise<{ done: number; fail: number }> {
  if (uploadInFlight) return { done: 0, fail: 0 };
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { done: 0, fail: 0 };
  uploadInFlight = true;
  let done = 0;
  let fail = 0;
  try {
    const pending = await db.pendingPhotos.toArray();
    for (const p of pending) {
      let url = p.uploadedUrl;
      if (!url) {
        url = (await postPhoto(p.module, p.uid, p.blob, p.mime)) ?? undefined;
        if (!url) {
          fail += 1;
          continue;
        }
        await db.pendingPhotos.update(p.id, { uploadedUrl: url });
        emitPhotoUploaded({ id: p.id, module: p.module, uid: p.uid, url });
      }

      const table = tableFor(p.module);
      const record = (await table.get(p.uid)) as Synced | undefined;
      if (!record) continue; // form hasn't been submitted yet — retry next sweep

      const updated: Synced = { ...record, photos: [...(record.photos ?? []), url], synced: false };
      await table.put(updated as unknown as AnyRecord);
      queueSync(p.module, updated);
      await db.pendingPhotos.delete(p.id);
      done += 1;
    }
  } finally {
    uploadInFlight = false;
  }
  return { done, fail };
}

let engineStarted = false;

/** Call once from a client root component (see sync-engine-init.tsx). Kept
 * separate from lib/sync.ts's own engine to avoid a circular import (this
 * module already depends on sync.ts's queueSync) — same retry triggers:
 * reconnect + a periodic sweep. */
export function initPhotoUploadEngine() {
  if (engineStarted || typeof window === "undefined") return;
  engineStarted = true;
  window.addEventListener("online", () => void uploadPendingPhotos());
  void uploadPendingPhotos();
  window.setInterval(() => void uploadPendingPhotos(), 60_000);
}
