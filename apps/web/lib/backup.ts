import { db, MODULE_KEYS, tableFor } from "./db";
import { genUid } from "./reference-data";
import { todayJStr } from "./jalaali";
import type { AnyRecord, ModuleKey, Synced } from "./types";

const LABELS: Record<ModuleKey, string> = {
  attendance: "hrRows",
  machinery: "logRows",
  irrigation: "irrRows",
  pest_fertilizer: "sprayRows",
  orchard: "orchardRows",
  inventory: "invRows",
  accounting: "accRows",
  harvest: "harvRows",
  sheep: "sheepRows",
  security: "securityRows",
};

export async function backupJSON() {
  const payload: Record<string, unknown> = {};
  for (const m of MODULE_KEYS) {
    payload[LABELS[m]] = await tableFor(m).toArray();
  }
  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `farm_backup_${todayJStr().replace(/\//g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function ensureMeta(arr: unknown): Synced[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((r) => {
    const rec = r as Partial<Synced>;
    return { ...rec, uid: rec.uid || genUid(), synced: typeof rec.synced === "boolean" ? rec.synced : false } as Synced;
  });
}

/** Restores a backup file. Existing local records are replaced wholesale —
 * this is a deliberate "restore point" operation, not a merge. */
export async function restoreJSON(file: File): Promise<void> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  await db.transaction("rw", MODULE_KEYS.map((m) => tableFor(m)), async () => {
    for (const m of MODULE_KEYS) {
      const rows = ensureMeta(parsed[LABELS[m]]);
      const table = tableFor(m);
      await table.clear();
      if (rows.length) await table.bulkPut(rows as unknown as AnyRecord[]);
    }
  });
}

export async function clearAllData(): Promise<void> {
  await db.transaction("rw", MODULE_KEYS.map((m) => tableFor(m)), async () => {
    for (const m of MODULE_KEYS) await tableFor(m).clear();
  });
}
