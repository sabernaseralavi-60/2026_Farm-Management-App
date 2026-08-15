import { d2j, j2d, jalaaliWeekday, pad2, parseJalaaliStr, todayJStr } from "./jalaali";

/** Small shared helpers for the admin/owner date-range pickers — kept in one
 * place so "this week"/"this month" mean the same thing everywhere. */

export function daysAgo(n: number): string {
  const t = parseJalaaliStr(todayJStr())!;
  const jdn = j2d(t.jy, t.jm, t.jd) - n;
  const j = d2j(jdn);
  return `${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`;
}

export function startOfMonth(): string {
  const t = parseJalaaliStr(todayJStr())!;
  return `${t.jy}/${pad2(t.jm)}/01`;
}

export function startOfWeek(): string {
  const t = parseJalaaliStr(todayJStr())!;
  const jdn = j2d(t.jy, t.jm, t.jd);
  const weekday = jalaaliWeekday(t.jy, t.jm, t.jd);
  const j = d2j(jdn - weekday);
  return `${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`;
}
