import { del, put } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canSyncModule } from "@/lib/access";
import { GATE_COOKIE, getGateSession } from "@/lib/gate";
import { SYNC_SCHEMAS } from "@/lib/sync-schemas";
import type { ModuleKey } from "@/lib/types";

function isModuleKey(v: string): v is ModuleKey {
  return v in SYNC_SCHEMAS;
}

// Only these carry a photo picker in the UI — kept as an allowlist here too
// so the endpoint can't be used to stash files under an unrelated module.
const PHOTO_MODULES: ModuleKey[] = ["machinery", "orchard", "harvest", "security"];

// Client compression targets ~150-400 KB (see lib/image-compress.ts); this
// is a generous server-side ceiling, not the real target — just a guard
// against something abusive reaching Blob storage.
const MAX_BYTES = 4 * 1024 * 1024;

const UID_PATTERN = /^[a-z0-9]+$/i;

// POST /api/photos/upload?module=<key>&uid=<record uid>&ext=webp|jpg — body
// is the already-compressed image bytes, Content-Type set to its mime type.
// Stored in Vercel Blob at farm-photos/<module>/<uid>/<random>.<ext>, public
// (unguessable URL, not access-controlled) — same trust level as the
// module-hero icons already served publicly by this app.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const gate = await getGateSession(cookieStore.get(GATE_COOKIE)?.value);
  if (!gate) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const moduleKey = searchParams.get("module") ?? "";
  const uid = searchParams.get("uid") ?? "";
  const ext = searchParams.get("ext") === "jpg" ? "jpg" : "webp";

  if (!isModuleKey(moduleKey) || !PHOTO_MODULES.includes(moduleKey)) {
    return NextResponse.json({ ok: false, error: "unknown module" }, { status: 404 });
  }
  if (!canSyncModule(gate.access, moduleKey)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (!uid || !UID_PATTERN.test(uid)) {
    return NextResponse.json({ ok: false, error: "invalid uid" }, { status: 400 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "file too large" }, { status: 413 });
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "invalid or oversized file" }, { status: 413 });
  }

  try {
    const pathname = `farm-photos/${moduleKey}/${uid}/${crypto.randomUUID()}.${ext}`;
    const blob = await put(pathname, bytes, {
      access: "public",
      addRandomSuffix: false,
      contentType: ext === "webp" ? "image/webp" : "image/jpeg",
    });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    console.error("photo upload failed", err);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}

// DELETE /api/photos/upload — body: { url }. Best-effort: a record's own
// sync (PATCH via the normal upsert) is what actually removes the URL from
// the record; this just reclaims the Blob storage behind it.
export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const gate = await getGateSession(cookieStore.get(GATE_COOKIE)?.value);
  if (!gate) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const url = (body as { url?: unknown })?.url;
  if (typeof url !== "string" || !url.includes("blob.vercel-storage.com")) {
    return NextResponse.json({ ok: false, error: "invalid url" }, { status: 400 });
  }

  try {
    await del(url);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("photo delete failed", err);
    // Not fatal for the caller — the record's `photos` array is the source
    // of truth for what's actually shown; an orphaned Blob file is a
    // cleanup nuisance, not a data-loss or correctness problem.
    return NextResponse.json({ ok: true });
  }
}
