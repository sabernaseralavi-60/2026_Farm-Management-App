import { NextResponse } from "next/server";
import { isTableKey, listTables, queryTable } from "@/lib/admin-tables";
import { getOwnerSession } from "@/lib/session";

const PER_TABLE_LIMIT = 5;

// GET /api/owner/search?q=... — searches every module at once (built on the
// same fixed per-table allowlist as /api/owner/data) and returns the top
// few matches per table, so the owner dashboard's search box can show one
// grouped dropdown instead of clicking into ten separate tables.
export async function GET(request: Request) {
  const session = await getOwnerSession();
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ ok: true, q, groups: [] });
  }

  const tables = listTables().filter((t) => isTableKey(t.key));
  const results = await Promise.all(
    tables.map(async (t) => {
      if (!isTableKey(t.key)) throw new Error("unreachable"); // narrowed by the filter above
      const { rows, total } = await queryTable(t.key, { page: 1, pageSize: PER_TABLE_LIMIT, q });
      return { key: t.key, label: t.label, icon: t.icon, columns: t.columns, total, rows };
    }),
  );

  return NextResponse.json({ ok: true, q, groups: results.filter((g) => g.total > 0) });
}
