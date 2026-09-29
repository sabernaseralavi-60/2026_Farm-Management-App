"use client";

import { useEffect, useRef, useState } from "react";
import { pendingPhotosFor, queuePhotoUpload, removePendingPhoto, type QueuedPhoto } from "@/lib/photo-upload";
import { onPhotoUploaded } from "@/lib/sync-bus";
import type { ModuleKey } from "@/lib/types";
import { toast } from "@/lib/toast";

interface PendingItem extends QueuedPhoto {
  uploaded: boolean;
}

/** Photo attachment for a form (machinery/orchard/harvest/security). Every
 * photo is compressed client-side and queued offline-first (see
 * lib/photo-upload.ts) — this component only handles picking, previewing
 * and removing. `uid` must already be assigned before this mounts (the
 * module pages generate it up front, not just at submit) so a photo picked
 * while still composing a brand-new record has somewhere to attach to. */
export function PhotoPicker({
  module,
  uid,
  photos,
  onPhotosChange,
}: {
  module: ModuleKey;
  uid: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}) {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrls = useRef<Set<string>>(new Set());

  // Restore any photos still queued from before a reload (e.g. picked while
  // offline, or the tab closed mid-upload).
  useEffect(() => {
    let cancelled = false;
    void pendingPhotosFor(module, uid).then((rows) => {
      if (cancelled) return;
      setPending(
        rows.map((r) => {
          const previewUrl = URL.createObjectURL(r.blob);
          previewUrls.current.add(previewUrl);
          return { id: r.id, previewUrl, uploaded: Boolean(r.uploadedUrl) };
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [module, uid]);

  // A queued photo finishing upload — drop it from "pending" and add its
  // URL to the record's photo list.
  useEffect(
    () =>
      onPhotoUploaded((d) => {
        if (d.module !== module || d.uid !== uid) return;
        setPending((prev) => prev.filter((p) => p.id !== d.id));
        onPhotosChange([...photos, d.url]);
      }),
    [module, uid, photos, onPhotosChange],
  );

  useEffect(
    () => () => {
      previewUrls.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  async function onFilesPicked(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        try {
          const q = await queuePhotoUpload(module, uid, file);
          previewUrls.current.add(q.previewUrl);
          setPending((prev) => [...prev, { ...q, uploaded: false }]);
        } catch {
          toast.error(`فشرده‌سازی عکس «${file.name}» ناموفق بود.`);
        }
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeUploaded(url: string) {
    onPhotosChange(photos.filter((p) => p !== url));
    try {
      await fetch("/api/photos/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch {
      // Removed from the record either way; an orphan Blob file is a
      // cleanup nuisance, not something the user needs to see.
    }
  }

  async function cancelPending(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id));
    await removePendingPhoto(id);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {photos.map((url) => (
          <div key={url} className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-sand-300">
            {/* eslint-disable-next-line @next/next/no-img-element -- external Blob URLs, not a local/optimizable asset */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => void removeUploaded(url)}
              aria-label="حذف عکس"
              className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
        {pending.map((p) => (
          <div key={p.id} className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-sand-300">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not a servable asset */}
            <img src={p.previewUrl} alt="" className="h-full w-full object-cover opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
              <span className="text-[10px] font-bold text-white">در حال ارسال...</span>
            </div>
            <button
              type="button"
              onClick={() => void cancelPending(p.id)}
              aria-label="لغو"
              className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-sand-300 text-bark-500 hover:border-leaf-500 hover:text-leaf-600 disabled:opacity-50"
        >
          <span aria-hidden className="text-xl leading-none">
            📷
          </span>
          <span className="text-[10px] font-bold">افزودن عکس</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => void onFilesPicked(e.target.files)}
      />
    </div>
  );
}
