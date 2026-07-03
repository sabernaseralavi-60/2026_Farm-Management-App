// Jalali (Persian) calendar conversion — ported verbatim (algorithm-for-algorithm)
// from the original prototype's jalaali-js-derived implementation (MIT-style
// public algorithm by roozbehp/jalaali-js). Kept as pure functions so the
// exact date arithmetic the farm has been using is preserved.

function div(a: number, b: number) {
  return Math.trunc(a / b);
}

interface JalCalResult {
  leap: number;
  gy: number;
  march: number;
}

function jalCal(jy: number): JalCalResult {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324,
    2394, 2456, 3178,
  ];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jm = 0;
  let jump = 0;
  let n = 0;
  for (let i = 1; i < bl; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(jump % 33, 4);
    jp = jm;
  }
  n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div((n % 33) + 3, 4);
  if (jump % 33 === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = ((n + 1) % 33) - 1;
  leap = leap % 4;
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

export function isLeapJalaali(jy: number) {
  return jalCal(jy).leap === 0;
}

export function jMonthLen(jy: number, jm: number) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaali(jy) ? 30 : 29;
}

function g2d(gy: number, gm: number, gd: number) {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * ((gm + 9) % 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(j % 1461, 4) * 5 + 308;
  const gd = div(i % 153, 5) + 1;
  const gm = (div(i, 153) % 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

export function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

export function d2j(jdn: number) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let jd: number;
  let jm: number;
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = (k % 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = (k % 30) + 1;
  return { jy, jm, jd };
}

export function toJalaali(gy: number, gm: number, gd: number) {
  return d2j(g2d(gy, gm, gd));
}

export function toGregorian(jy: number, jm: number, jd: number) {
  return d2g(j2d(jy, jm, jd));
}

export const JMONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const faDigits = "۰۱۲۳۴۵۶۷۸۹";

export function toFa(v: unknown): string {
  return String(v).replace(/[0-9]/g, (d) => faDigits[Number(d)]);
}

export function faToEn(v: unknown): string {
  return String(v).replace(/[۰-۹]/g, (d) => String(faDigits.indexOf(d)));
}

export function numFa(v: number | string | null | undefined): string {
  if (v === "" || v == null || Number.isNaN(Number(v))) return "۰";
  return toFa(Number(v).toLocaleString("en-US"));
}

export const money = numFa;

export function pad2(n: number) {
  return n < 10 ? "0" + n : "" + n;
}

export function todayJStr(): string {
  const t = new Date();
  const j = toJalaali(t.getFullYear(), t.getMonth() + 1, t.getDate());
  return `${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`;
}

export function parseJalaaliStr(v: string): { jy: number; jm: number; jd: number } | null {
  const p = (v || "").split("/").map(Number);
  if (p.length === 3 && p[0]) return { jy: p[0], jm: p[1], jd: p[2] };
  return null;
}

/** Day-of-week index (0 = Saturday .. 6 = Friday) for a jalaali date, used by the picker grid. */
export function jalaaliWeekday(jy: number, jm: number, jd: number) {
  const g = toGregorian(jy, jm, jd);
  return (new Date(g.gy, g.gm - 1, g.gd).getDay() + 1) % 7;
}

/** true if the given jalaali date string falls on Friday (weekend), used by attendance queries. */
export function isFridayJalaali(dateStr: string) {
  const p = parseJalaaliStr(dateStr);
  if (!p) return false;
  return jalaaliWeekday(p.jy, p.jm, p.jd) === 6;
}
