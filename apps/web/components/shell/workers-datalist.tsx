"use client";

import { useEffect, useMemo } from "react";
import { WORKERS } from "@/lib/reference-data";
import { useModuleStore } from "@/lib/store";
import type { AttendanceRecord } from "@/lib/types";

/** Feeds the shared <datalist id="workers-list"> used by every worker-name
 * input across modules, so typing a brand-new name in one module makes it
 * suggestible everywhere else too. */
export function WorkersDatalist() {
  const { rows, loaded, load } = useModuleStore<AttendanceRecord>("attendance")();

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  const names = useMemo(() => {
    const set = new Set(WORKERS);
    rows.forEach((r) => r.worker && set.add(r.worker));
    return [...set];
  }, [rows]);

  return (
    <datalist id="workers-list">
      {names.map((n) => (
        <option key={n} value={n} />
      ))}
    </datalist>
  );
}
