"use client";

// Client-side photo compression before upload — nothing full-size ever
// leaves the device. A phone photo is typically 3-8 MB; this brings it down
// to roughly 150-400 KB, which matters twice over: it's what keeps photo
// uploads cheap on Vercel Blob's free tier, and it's what makes uploading
// from a weak farm connection actually work.

const MAX_DIMENSION = 1600; // long edge, px — plenty for reviewing an incident/breakdown photo
const TARGET_MAX_BYTES = 400_000;
const INITIAL_QUALITY = 0.75;
const MIN_QUALITY = 0.35;
const QUALITY_STEP = 0.15;
const MAX_ATTEMPTS = 4;

export interface CompressedPhoto {
  blob: Blob;
  mimeType: "image/webp" | "image/jpeg";
  width: number;
  height: number;
}

let webpSupport: boolean | null = null;

/** Canvas-encoded WebP is supported by every current mobile/desktop browser
 * this app targets; this is just a cheap synchronous guard for the rare
 * older WebView, falling back to JPEG (still far smaller than the original). */
function supportsWebp(): boolean {
  if (webpSupport !== null) return webpSupport;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    webpSupport = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Decodes, downsizes and re-encodes an image file entirely in the browser.
 * Iteratively drops quality (never resolution again) until it's under the
 * target size or hits the quality floor — most farm-incident photos land
 * well under the target on the first pass. */
export async function compressImage(file: File): Promise<CompressedPhoto> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const mimeType: CompressedPhoto["mimeType"] = supportsWebp() ? "image/webp" : "image/jpeg";
    let quality = INITIAL_QUALITY;
    let blob = await canvasToBlob(canvas, mimeType, quality);

    for (let i = 0; i < MAX_ATTEMPTS && blob && blob.size > TARGET_MAX_BYTES && quality > MIN_QUALITY; i++) {
      quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
      blob = await canvasToBlob(canvas, mimeType, quality);
    }
    if (!blob) throw new Error("image encoding failed");

    return { blob, mimeType, width, height };
  } finally {
    bitmap.close();
  }
}
