import { cookies } from "next/headers";
import { after, NextResponse } from "next/server";
import { isDateEditable } from "@/lib/date-policy";
import { canSyncModule } from "@/lib/access";
import type { GateSession } from "@/lib/gate";
import { GATE_COOKIE, getGateSession } from "@/lib/gate";
import { notifyDataEntry } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { SYNC_SCHEMAS, toPrismaData } from "@/lib/sync-schemas";
import type { ModuleKey } from "@/lib/types";

const DELEGATE: Record<ModuleKey, keyof typeof prisma> = {
  attendance: "attendance",
  machinery: "machinery",
  irrigation: "irrigation",
  pest_fertilizer: "pestFertilizer",
  orchard: "orchard",
  inventory: "inventory",
  accounting: "accounting",
  harvest: "harvest",
  sheep: "sheep",
  security: "security",
};

function isModuleKey(v: string): v is ModuleKey {
  return v in SYNC_SCHEMAS;
}

/** Pings Saber on Bale for every worker-app entry/removal — his own
 * (including from his phone) as well as every named login (Milad, Mousa,
 * ...) and the shared farm PIN. Scheduled via next/server's `after()`, not
 * a bare `void` fire-and-forget: on Vercel's serverless runtime an
 * un-awaited promise can simply be killed the instant the response is
 * sent, so the Bale request might never actually leave the function.
 * `after()` keeps the function alive long enough to finish it, while still
 * letting the response return immediately — and notify.ts itself swallows
 * delivery errors, so a Bale outage still can't affect the sync response. */
function notifyDataChange(
  gate: GateSession,
  action: "ثبت/ویرایش" | "حذف",
  module: ModuleKey,
  data: Record<string, unknown>,
  request: Request,
) {
  const baseUrl = new URL(request.url).origin;
  const displayName = gate.displayName ?? gate.user ?? "رمز مشترک مزرعه";
  after(() => notifyDataEntry({ action, module, displayName, data, baseUrl }));
}

// POST /api/sync/[module] — idempotent upsert keyed on the client-generated
// `uid`. Safe to call repeatedly with the same payload (offline retries,
// duplicate sends after a flaky connection): the second call just updates
// the same row instead of creating a new one.
export async function POST(request: Request, ctx: RouteContext<"/api/sync/[module]">) {
  const cookieStore = await cookies();
  const gate = await getGateSession(cookieStore.get(GATE_COOKIE)?.value);
  if (!gate) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { module } = await ctx.params;

  if (!isModuleKey(module)) {
    return NextResponse.json({ ok: false, error: "unknown module" }, { status: 404 });
  }
  if (!canSyncModule(gate.access, module)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const schema = SYNC_SCHEMAS[module];
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const record = parsed.data as { uid: string; date: string };
  if (!isDateEditable(record.date)) {
    return NextResponse.json(
      { ok: false, error: "این تاریخ قفل شده و دیگر قابل ثبت/ویرایش نیست." },
      { status: 403 },
    );
  }

  const uid = record.uid;
  const data = toPrismaData(module, parsed.data as Record<string, unknown>);
  const delegateKey = DELEGATE[module];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = (prisma as any)[delegateKey];
    const saved = await delegate.upsert({
      where: { uid },
      create: { uid, ...data },
      update: data,
    });
    notifyDataChange(gate, "ثبت/ویرایش", module, parsed.data as Record<string, unknown>, request);
    return NextResponse.json({ ok: true, uid: saved.uid });
  } catch (err) {
    console.error(`sync upsert failed for ${module}`, err);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}

// DELETE /api/sync/[module] — idempotent delete keyed on `uid` (body:
// { uid: string }). Safe to call repeatedly: a uid that's already gone (or
// never existed) still returns ok:true, since offline retries can't tell
// whether their previous attempt actually landed.
export async function DELETE(request: Request, ctx: RouteContext<"/api/sync/[module]">) {
  const cookieStore = await cookies();
  const gate = await getGateSession(cookieStore.get(GATE_COOKIE)?.value);
  if (!gate) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { module } = await ctx.params;
  if (!isModuleKey(module)) {
    return NextResponse.json({ ok: false, error: "unknown module" }, { status: 404 });
  }
  if (!canSyncModule(gate.access, module)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const uid = (body as { uid?: unknown })?.uid;
  if (typeof uid !== "string" || !uid) {
    return NextResponse.json({ ok: false, error: "uid is required" }, { status: 400 });
  }

  const delegateKey = DELEGATE[module];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = (prisma as any)[delegateKey];
    const existing = await delegate.findUnique({ where: { uid } });
    if (!existing) {
      // Already gone (or never synced) — deletion is still the correct
      // end state, so this is success, not a 404.
      return NextResponse.json({ ok: true, uid });
    }
    if (!isDateEditable(existing.date)) {
      return NextResponse.json(
        { ok: false, error: "این تاریخ قفل شده و دیگر قابل حذف نیست." },
        { status: 403 },
      );
    }
    await delegate.delete({ where: { uid } });
    notifyDataChange(gate, "حذف", module, existing as Record<string, unknown>, request);
    return NextResponse.json({ ok: true, uid });
  } catch (err) {
    console.error(`sync delete failed for ${module}`, err);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
