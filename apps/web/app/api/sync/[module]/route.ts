import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isDateEditable } from "@/lib/date-policy";
import { GATE_COOKIE, verifyGateToken } from "@/lib/gate";
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

// POST /api/sync/[module] — idempotent upsert keyed on the client-generated
// `uid`. Safe to call repeatedly with the same payload (offline retries,
// duplicate sends after a flaky connection): the second call just updates
// the same row instead of creating a new one.
export async function POST(request: Request, ctx: RouteContext<"/api/sync/[module]">) {
  const cookieStore = await cookies();
  const gateOk = await verifyGateToken(cookieStore.get(GATE_COOKIE)?.value);
  if (!gateOk) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { module } = await ctx.params;

  if (!isModuleKey(module)) {
    return NextResponse.json({ ok: false, error: "unknown module" }, { status: 404 });
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
    return NextResponse.json({ ok: true, uid: saved.uid });
  } catch (err) {
    console.error(`sync upsert failed for ${module}`, err);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
