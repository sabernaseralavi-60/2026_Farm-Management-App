"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatCell, type TableColumn } from "@/lib/table-format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
interface Group {
  key: string;
  label: string;
  icon: string;
  columns: TableColumn[];
  total: number;
  rows: Row[];
}

const DEBOUNCE_MS = 300;

/** One search box, every module at once — see /api/owner/search. Picking a
 * result deep-links into the full data browser (/owner/data) for that table
 * with the same query pre-filled. */
export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) return;
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/owner/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) setGroups(data.groups);
        })
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [q]);

  // Nothing to show for a too-short query — computed at render time instead
  // of reset via a synchronous setState in the effect above.
  const visibleGroups = q.trim().length < 2 ? [] : groups;

  return (
    <div ref={wrapRef} className="relative w-full max-w-xs">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="🔍 جست‌وجو در همه دفاتر..."
        className="w-full rounded-xl border border-sand-300 bg-white/80 px-3.5 py-2 text-fluid-xs font-semibold outline-none focus:ring-2 focus:ring-leaf-500"
      />
      {open && q.trim().length >= 2 && (
        <div className="glass-strong absolute z-50 mt-1.5 max-h-96 w-full min-w-[20rem] overflow-y-auto rounded-2xl p-2 shadow-xl sm:w-[26rem]">
          {loading && <p className="p-3 text-fluid-xs text-bark-500">در حال جست‌وجو...</p>}
          {!loading && visibleGroups.length === 0 && <p className="p-3 text-fluid-xs text-bark-500">نتیجه‌ای یافت نشد.</p>}
          {!loading &&
            visibleGroups.map((g) => (
              <div key={g.key} className="mb-1.5 last:mb-0">
                <div className="flex items-center justify-between px-2 py-1 text-fluid-xs font-bold text-bark-600">
                  <span>
                    <span aria-hidden>{g.icon}</span> {g.label}
                  </span>
                  <Link
                    href={`/owner/data?table=${g.key}&q=${encodeURIComponent(q.trim())}`}
                    className="text-leaf-700 hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    {g.total} مورد — همه ›
                  </Link>
                </div>
                {g.rows.map((r) => (
                  <Link
                    key={r.uid ?? r.id}
                    href={`/owner/data?table=${g.key}&q=${encodeURIComponent(q.trim())}`}
                    onClick={() => setOpen(false)}
                    className="block truncate rounded-lg px-2 py-1.5 text-fluid-xs text-bark-700 hover:bg-sand-100"
                  >
                    {g.columns
                      .slice(0, 3)
                      .map((c) => formatCell(r, c))
                      .join(" · ")}
                  </Link>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
