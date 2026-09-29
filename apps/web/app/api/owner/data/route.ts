import { NextResponse } from "next/server";
import { isTableKey, listTables, queryTable } from "@/lib/admin-tables";
import { getOwnerSession } from "@/lib/session";

// GET /api/owner/data — read-only data browser behind the owner dashboard.
// `table` must be one of the fixed keys in lib/admin-tables.ts; every column
// and search field is server-defined (see that file's comment) — the client
// never supplies a raw filter or column list, so this can't be used to read
// anything outside the intended per-table allowlist.
export async function GET(request: Request) {
  const session = await getOwnerSession();
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table") ?? "";

  if (!table) {
    return NextResponse.json({ ok: true, tables: listTables() });
  }
  if (!isTableKey(table)) {
    return NextResponse.json({ ok: false, error: "unknown table" }, { status: 404 });
  }

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(500, Math.max(1, Number(searchParams.get("pageSize")) || 50));
  const q = searchParams.get("q")?.trim() || undefined;
  const from = searchParams.get("from")?.trim() || undefined;
  const to = searchParams.get("to")?.trim() || undefined;

  const { rows, total, columns } = await queryTable(table, { page, pageSize, q, from, to });
  return NextResponse.json({ ok: true, table, page, pageSize, total, columns, rows });
}
