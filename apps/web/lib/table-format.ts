import { money, toFa } from "./jalaali";

export interface TableColumn {
  key: string;
  label: string;
  type?: "number" | "boolean" | "array";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

/** Shared cell formatting for the owner-dashboard data browser and its
 * global search dropdown, so a record reads the same way in both places. */
export function formatCell(row: Row, col: TableColumn): string {
  const v = row[col.key];
  if (v === null || v === undefined || v === "") return "—";
  if (col.type === "boolean") return v ? "✓" : "—";
  if (col.type === "array") return Array.isArray(v) && v.length ? toFa(v.join("، ")) : "—";
  if (col.type === "number") return money(v);
  return String(v);
}
