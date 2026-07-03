import { NextResponse } from "next/server";
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

  const uid = (parsed.data as { uid: string }).uid;
  const data = toPrismaData(module, parsed.data as Record<string, unknown>);
  const delegateKey = DELEGATE[module];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = (prisma as any)[delegateKey];
    const record = await delegate.upsert({
      where: { uid },
      create: { uid, ...data },
      update: data,
    });
    return NextResponse.json({ ok: true, uid: record.uid });
  } catch (err) {
    console.error(`sync upsert failed for ${module}`, err);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
