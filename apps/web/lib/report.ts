import { d2j, faToEn, isFridayJalaali, j2d, jMonthLen, jalaaliWeekday, money, numFa, pad2, toFa } from "./jalaali";
import type {
  AccountingRecord,
  AttendanceRecord,
  HarvestRecord,
  InventoryRecord,
  IrrigationRecord,
  MachineryRecord,
  OrchardRecord,
  PestFertilizerRecord,
  SecurityRecord,
  SheepRecord,
  Synced,
} from "./types";

export type Period = "daily" | "weekly" | "monthly" | "yearly";

export function periodLabel(p: Period) {
  return { daily: "روزانه", weekly: "هفتگی", monthly: "ماهیانه", yearly: "سالیانه" }[p];
}

function jdnOf(dateStr: string) {
  const p = String(dateStr || "").split("/").map(Number);
  return j2d(p[0], p[1], p[2]);
}

export type Range = [number, number];

export function periodRange(period: Period, dateStr: string): Range {
  const [jy, jm, jd] = dateStr.split("/").map(Number);
  const jdn = j2d(jy, jm, jd);
  if (period === "weekly") {
    // Saturday-start week (0=Sat..6=Fri), matching the Iranian calendar convention.
    const weekday = jalaaliWeekday(jy, jm, jd);
    return [jdn - weekday, jdn - weekday + 6];
  }
  if (period === "monthly") return [j2d(jy, jm, 1), j2d(jy, jm, jMonthLen(jy, jm))];
  if (period === "yearly") return [j2d(jy, 1, 1), j2d(jy, 12, jMonthLen(jy, 12))];
  return [jdn, jdn];
}

export function periodRangeLabel(range: Range) {
  const a = d2j(range[0]);
  const b = d2j(range[1]);
  const fa = `${a.jy}/${pad2(a.jm)}/${pad2(a.jd)}`;
  const fb = `${b.jy}/${pad2(b.jm)}/${pad2(b.jd)}`;
  return fa === fb ? toFa(fa) : `${toFa(fa)} تا ${toFa(fb)}`;
}

export function inRange(dateStr: string, range: Range) {
  if (!dateStr) return false;
  const p = String(dateStr).split("/").map(Number);
  if (p.length < 3 || !p[0]) return false;
  const jdn = j2d(p[0], p[1], p[2]);
  return jdn >= range[0] && jdn <= range[1];
}

export function byRange<T extends { date: string }>(arr: T[], range: Range): T[] {
  return arr.filter((r) => inRange(r.date, range));
}

export function dateRangeList(fromStr: string, toStr: string) {
  const s = jdnOf(fromStr);
  const e = jdnOf(toStr);
  const out: string[] = [];
  for (let n = Math.min(s, e); n <= Math.max(s, e); n++) {
    const j = d2j(n);
    out.push(`${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`);
  }
  return out;
}

function shiftHours(inT?: string, outT?: string) {
  if (!inT || !outT) return 0;
  const [ah, am] = inT.split(":").map(Number);
  const [bh, bm] = outT.split(":").map(Number);
  const diff = (bh * 60 + bm - (ah * 60 + am)) / 60;
  return diff > 0 ? diff : 0;
}

export function attendanceQuery(rows: AttendanceRecord[], worker: string, from: string, to: string, excludeFridays: boolean) {
  const days = dateRangeList(from, to);
  const present: string[] = [];
  const leave: string[] = [];
  const absent: string[] = [];
  let hours = 0;
  let bonus = 0;
  for (const d of days) {
    const recs = rows.filter((r) => r.worker === worker && r.date === d);
    if (!recs.length) {
      if (excludeFridays && isFridayJalaali(d)) continue;
      absent.push(d);
      continue;
    }
    for (const r of recs) {
      if (r.status === "leave") {
        leave.push(d);
        continue;
      }
      present.push(d);
      bonus += (Number(r.morning?.bonus) || 0) + (Number(r.evening?.bonus) || 0);
      hours += shiftHours(r.morning?.in, r.morning?.out) + shiftHours(r.evening?.in, r.evening?.out);
    }
  }
  return { present, leave, absent, hours: +hours.toFixed(1), bonus };
}

export function machineryQuery(rows: MachineryRecord[], machine: string, from: string, to: string) {
  const lo = Math.min(jdnOf(from), jdnOf(to));
  const hi = Math.max(jdnOf(from), jdnOf(to));
  const recs = rows.filter((r) => r.machine === machine && jdnOf(r.date) >= lo && jdnOf(r.date) <= hi);
  const hours = recs.reduce((a, r) => a + (Number(r.usefulHours) || 0), 0);
  const serviceLogs = recs.filter((r) => r.category.includes("سرویس") || r.category.includes("خرابی"));
  const cost = serviceLogs.reduce((a, r) => {
    const m = String(r.cost || "").match(/[\d۰-۹,]+/);
    if (!m) return a;
    const n = parseFloat(faToEn(m[0]).replace(/,/g, ""));
    return a + (Number.isNaN(n) ? 0 : n);
  }, 0);
  return { recs, hours: +hours.toFixed(1), serviceCount: serviceLogs.length, cost };
}

export interface AllModulesData {
  attendance: AttendanceRecord[];
  machinery: MachineryRecord[];
  irrigation: IrrigationRecord[];
  spray: PestFertilizerRecord[];
  orchard: OrchardRecord[];
  inventory: InventoryRecord[];
  accounting: AccountingRecord[];
  harvest: HarvestRecord[];
  sheep: SheepRecord[];
  security: SecurityRecord[];
}

export function buildManagementReport(period: Period, dateStr: string, data: AllModulesData): string {
  const range = periodRange(period, dateStr);
  const rangeLbl = periodRangeLabel(range);

  const hr = byRange(data.attendance, range);
  const hrPresent = hr.filter((r) => r.status === "present");
  const hrLeave = hr.filter((r) => r.status === "leave");
  const hrApproved = hrPresent.filter((r) => r.morning?.quality || r.evening?.quality).length;
  const hrBonus = hrPresent.reduce((a, r) => a + (Number(r.morning?.bonus) || 0) + (Number(r.evening?.bonus) || 0), 0);
  const workers = [...new Set(hr.map((r) => r.worker))].join("، ");

  const lg = byRange(data.machinery, range);
  const totalHours = lg.reduce((a, r) => a + (Number(r.usefulHours) || 0), 0);
  const incidents = lg.filter((r) => r.category.includes("خرابی")).length;
  const machines = [...new Set(lg.map((r) => r.machine))].join("، ");

  const irrRecs = byRange(data.irrigation, range);
  const irrCount = irrRecs.reduce((a, r) => a + (Number(r.count) || 0), 0);

  const sp = byRange(data.spray, range);

  const oc = byRange(data.orchard, range);
  const ocDone = oc.filter((r) => r.status === "انجام شد").length;
  const ocGardens = new Set(oc.map((r) => r.garden)).size;

  const inv = byRange(data.inventory, range);
  const invIn = inv.filter((r) => r.type === "ورود").length;
  const invOut = inv.filter((r) => r.type === "خروج").length;

  const acc = byRange(data.accounting, range);
  const income = acc.filter((r) => r.type === "درآمد").reduce((a, r) => a + (Number(r.amount) || 0), 0);
  const expense = acc.filter((r) => r.type === "هزینه").reduce((a, r) => a + (Number(r.amount) || 0), 0);

  const hv = byRange(data.harvest, range);
  const harvested = hv.reduce((a, r) => a + (Number(r.harvested) || 0), 0);
  const sold = hv.reduce((a, r) => a + (Number(r.sold) || 0), 0);
  const revenue = hv.reduce((a, r) => a + (Number(r.sold) || 0) * (Number(r.price) || 0), 0);

  const sh = byRange(data.sheep, range);
  const shBirths = sh.filter((r) => r.category === "تولد بره/بزغاله").reduce((a, r) => a + (Number(r.count) || 0), 0);
  const shDeaths = sh.filter((r) => r.category === "تلفات").reduce((a, r) => a + (Number(r.count) || 0), 0);

  const se = byRange(data.security, range);

  const L: string[] = [];
  L.push("🌴 گزارش " + periodLabel(period) + " مزرعه حسین‌آباد شهکل");
  L.push("📍 شهرستان ریگان");
  L.push("📅 بازه: " + rangeLbl);
  L.push("━━━━━━━━━━━━━━");
  L.push("");

  L.push("👷 نیروی انسانی:");
  if (hr.length) {
    L.push("• کارکرد ثبت‌شده: " + toFa(hrPresent.length) + " مورد" + (workers ? " (" + workers + ")" : ""));
    L.push("• روزهای مرخصی: " + toFa(hrLeave.length) + " مورد");
    L.push("• تأیید کیفیت توسط مدیر: " + toFa(hrApproved) + " مورد");
    L.push("• مجموع پاداش: " + money(hrBonus) + " تومان");
  } else L.push("• رکوردی ثبت نشده است.");
  L.push("");

  L.push("🚜 ماشین‌آلات:");
  if (lg.length) {
    L.push("• رویدادهای ثبت‌شده: " + toFa(lg.length) + " مورد" + (machines ? " (" + machines + ")" : ""));
    L.push("• مجموع ساعات کارکرد مفید: " + toFa(+totalHours.toFixed(2)) + " ساعت");
    L.push("• موارد خرابی/حادثه: " + toFa(incidents) + " مورد");
  } else L.push("• رویدادی ثبت نشده است.");
  L.push("");

  L.push("💧 آبیاری:");
  if (irrRecs.length) {
    L.push("• روزهای آبیاری‌شده: " + toFa(irrRecs.length) + " روز");
    L.push("• مجموع آبریزهای آبیاری‌شده: " + toFa(irrCount));
  } else L.push("• آبیاری‌ای بایگانی نشده است.");
  L.push("");

  L.push("🌿 کود و سم‌پاشی:");
  L.push(sp.length ? "• عملیات ثبت‌شده: " + toFa(sp.length) + " مورد" : "• عملیاتی ثبت نشده است.");
  L.push("");

  L.push("🌳 امورات باغی:");
  L.push(
    oc.length
      ? "• کارهای ثبت‌شده: " + toFa(oc.length) + " مورد در " + toFa(ocGardens) + " باغ (انجام‌شده: " + toFa(ocDone) + ")"
      : "• کاری ثبت نشده است.",
  );
  L.push("");

  L.push("📦 انبار:");
  L.push(inv.length ? "• ورود: " + toFa(invIn) + " مورد | خروج: " + toFa(invOut) + " مورد" : "• تراکنشی ثبت نشده است.");
  L.push("");

  L.push("💰 حسابداری:");
  L.push("• مجموع درآمد: " + money(income) + " تومان");
  L.push("• مجموع هزینه: " + money(expense) + " تومان");
  L.push("• مانده: " + (income - expense < 0 ? "-" : "") + money(Math.abs(income - expense)) + " تومان");
  L.push("");

  L.push("🌾 برداشت و فروش:");
  if (hv.length) {
    L.push("• مجموع برداشت: " + numFa(harvested) + " کیلوگرم");
    L.push("• مجموع فروش: " + numFa(sold) + " کیلوگرم");
    L.push("• درآمد فروش: " + money(revenue) + " تومان");
  } else L.push("• رکوردی ثبت نشده است.");
  L.push("");

  L.push("🐑 دامداری (گوسفند):");
  if (sh.length) {
    L.push("• رکوردهای ثبت‌شده: " + toFa(sh.length) + " مورد");
    L.push("• تولدها: " + toFa(shBirths) + " | تلفات: " + toFa(shDeaths));
  } else L.push("• رکوردی ثبت نشده است.");
  L.push("");

  L.push("🛡 امنیت و تردد:");
  if (se.length) {
    L.push("• حوادث ثبت‌شده: " + toFa(se.length) + " مورد");
    se.slice(0, 5).forEach((r) => L.push("   - " + toFa(r.date) + ": " + r.title + " (" + r.type + ")"));
  } else L.push("• حادثه‌ای ثبت نشده است.");
  L.push("");

  L.push("━━━━━━━━━━━━━━");
  L.push("این گزارش توسط سامانه مدیریت مزرعه تولید شده است.");
  L.push("با احترام،");
  L.push("مدیر اجرایی مزرعه حسین‌آباد شهکل");

  return L.join("\n");
}

export function ensureMeta<T extends Partial<Synced>>(arr: T[]): T[] {
  arr.forEach((r) => {
    if (!r.uid) (r as Synced).uid = Math.random().toString(36).slice(2);
    if (typeof r.synced !== "boolean") (r as Synced).synced = false;
  });
  return arr;
}
