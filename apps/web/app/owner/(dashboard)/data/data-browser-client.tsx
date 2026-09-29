"use client";

import { clsx } from "clsx";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldWrap, TextInput } from "@/components/ui/fields";
import { GlassCard } from "@/components/ui/glass-card";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { toFa } from "@/lib/jalaali";
import { formatCell, type Row, type TableColumn } from "@/lib/table-format";

interface TableListing {
  key: string;
  label: string;
  icon: string;
  columns: TableColumn[];
}

const PAGE_SIZE = 50;

export function DataBrowserClient() {
  // Lets a link from the global search box (or any other page) deep-link
  // straight into a table with a query pre-filled, e.g. /owner/data?table=machinery&q=ماهیندرا.
  const searchParams = useSearchParams();
  const initialTable = searchParams.get("table");
  const initialQ = searchParams.get("q") ?? "";

  const [tables, setTables] = useState<TableListing[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(initialQ);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load the table list once.
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/owner/data");
      const data = await res.json();
      setTables(data.tables);
      const valid = initialTable && data.tables?.some((t: TableListing) => t.key === initialTable);
      setActive((prev) => prev ?? (valid ? initialTable : data.tables?.[0]?.key) ?? null);
    })();
    // Only ever meant to run once, off the URL as it was on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to page 1 whenever the table or filters change (adjusting state
  // during render avoids fetching page 1 of the old table first).
  const filterKey = `${active}:${q}:${from}:${to}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  // Same trick for the loading flag: flip it on as soon as the query
  // (table/page/filters) changes, during render, so the effect below only
  // ever calls setState from its own async callback.
  const queryKey = `${active}:${page}:${q}:${from}:${to}`;
  const [lastQueryKey, setLastQueryKey] = useState(queryKey);
  if (queryKey !== lastQueryKey) {
    setLastQueryKey(queryKey);
    setLoading(true);
  }

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const params = new URLSearchParams({ table: active, page: String(page), pageSize: String(PAGE_SIZE) });
    if (q.trim()) params.set("q", q.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/owner/data?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.ok) {
          setRows(data.rows);
          setTotal(data.total);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [active, page, q, from, to]);

  const table = tables?.find((t) => t.key === active);
  const columns = table?.columns ?? [];
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function exportFiltered() {
    if (!active || !table) return;
    setExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(table.label, { views: [{ rightToLeft: true }] });
      ws.addRow(table.columns.map((c) => c.label));
      ws.getRow(1).font = { bold: true };
      ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF573B23" } };
      ws.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      });

      const CAP = 10000; // sane ceiling so a runaway filter can't hang the browser tab
      for (let p = 1; p <= Math.ceil(Math.min(total, CAP) / 500) || p === 1; p++) {
        const params = new URLSearchParams({ table: active, page: String(p), pageSize: "500" });
        if (q.trim()) params.set("q", q.trim());
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const res = await fetch(`/api/owner/data?${params}`);
        const data = await res.json();
        if (!data.ok || !data.rows.length) break;
        for (const r of data.rows as Row[]) {
          ws.addRow(table.columns.map((c) => (c.type === "array" ? (r[c.key] ?? []).join("، ") : (r[c.key] ?? ""))));
        }
        if (p * 500 >= total || p * 500 >= CAP) break;
      }

      ws.columns.forEach((col) => {
        let max = 10;
        col.eachCell?.({ includeEmpty: false }, (cell) => {
          max = Math.max(max, String(cell.value ?? "").length + 2);
        });
        col.width = Math.min(60, max);
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${table.label}.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-fluid-lg font-extrabold text-white drop-shadow">🗄️ مرورگر جدول‌های داده</h2>
        <p className="mt-1 text-fluid-sm text-white/80">جست‌وجو و فیلتر مستقیم روی داده‌های خام هر دفتر — فقط خواندنی.</p>
      </div>

      {/* Table selector */}
      <div className="flex flex-wrap gap-2">
        {(tables ?? []).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={clsx(
              "flex items-center gap-1.5 rounded-full px-4 py-2 text-fluid-sm font-bold transition-colors",
              t.key === active ? "bg-white text-bark-800 shadow" : "bg-white/20 text-white hover:bg-white/30",
            )}
          >
            <span aria-hidden>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <GlassCard>
        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <FieldWrap label="جست‌وجو">
            <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="نام، شرح، ..." />
          </FieldWrap>
          <FieldWrap label="از تاریخ">
            <JalaliDatePicker value={from} onChange={setFrom} placeholder="بدون محدودیت" />
          </FieldWrap>
          <FieldWrap label="تا تاریخ">
            <JalaliDatePicker value={to} onChange={setTo} placeholder="بدون محدودیت" />
          </FieldWrap>
          <div className="flex items-end gap-2">
            {(q || from || to) && (
              <Button
                variant="soft"
                size="md"
                className="w-full"
                onClick={() => {
                  setQ("");
                  setFrom("");
                  setTo("");
                }}
              >
                پاک‌کردن فیلتر
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-fluid-sm font-semibold text-bark-600">
            {toFa(total.toLocaleString("en-US"))} ردیف — صفحه {toFa(page)} از {toFa(pageCount)}
          </p>
          <Button variant="soft" size="sm" onClick={exportFiltered} disabled={exporting || !total}>
            {exporting ? "در حال آماده‌سازی..." : "⬇️ دانلود Excel (نتایج فیلترشده)"}
          </Button>
        </div>

        {/* Table */}
        <div className="mt-3 overflow-x-auto rounded-xl border border-sand-200">
          <table className="w-full min-w-max text-fluid-sm">
            <thead>
              <tr className="bg-sand-100">
                {columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-3 py-2.5 text-right font-bold text-bark-700">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length || 1} className="px-3 py-8 text-center text-bark-500">
                    در حال بارگذاری...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length || 1} className="px-3 py-8 text-center text-bark-500">
                    رکوردی یافت نشد.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.uid ?? r.id} className="border-t border-sand-200 odd:bg-white/50 even:bg-sand-50/50">
                    {columns.map((c) => (
                      <td key={c.key} className="whitespace-nowrap px-3 py-2 text-bark-700">
                        {formatCell(r, c)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="soft" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ‹ قبلی
            </Button>
            <span className="px-2 text-fluid-sm font-bold text-bark-600">
              {toFa(page)} / {toFa(pageCount)}
            </span>
            <Button variant="soft" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
              بعدی ›
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
