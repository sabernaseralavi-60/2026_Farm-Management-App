import { d2j, j2d, pad2, parseJalaaliStr, todayJStr } from "./jalaali";

/**
 * How many days before today a record's `date` field may still be created or
 * edited. Today itself is always editable (0 days back); a value of 3 means
 * today plus the previous 3 days stay open, and anything older is locked —
 * this allows legitimate offline catch-up (a foreman logging a day late)
 * while preventing later tampering with settled historical records (e.g.
 * attendance tied to wages).
 */
export const EDITABLE_DAYS_BACK = 3;

function todayJdn(): number {
  const t = parseJalaaliStr(todayJStr())!;
  return j2d(t.jy, t.jm, t.jd);
}

export function isDateEditable(dateStr: string, daysBack: number = EDITABLE_DAYS_BACK): boolean {
  const parsed = parseJalaaliStr(dateStr);
  if (!parsed) return false;
  const jdn = j2d(parsed.jy, parsed.jm, parsed.jd);
  const diff = todayJdn() - jdn;
  return diff >= 0 && diff <= daysBack;
}

export function earliestEditableDate(daysBack: number = EDITABLE_DAYS_BACK): string {
  const j = d2j(todayJdn() - daysBack);
  return `${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`;
}
