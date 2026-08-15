import { NextResponse } from "next/server";
import { computeWorkerPerformance } from "@/lib/admin-analytics";
import { requireAdminSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) return NextResponse.json({ ok: false, error: "from/to are required" }, { status: 400 });

  const workers = await computeWorkerPerformance(from, to);
  return NextResponse.json({ ok: true, from, to, workers });
}
