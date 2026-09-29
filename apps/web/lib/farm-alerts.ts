import { daysAgo } from "./date-ranges";
import { prisma } from "./prisma";
import { toFa } from "./jalaali";
import { MACHINES } from "./reference-data";

/** Simple, explainable rule-based alerts for the owner dashboard — no AI
 * involved, just thresholds over the existing tables. Each rule is cheap
 * (a handful of indexed queries) so this can run on every dashboard load. */

export type AlertSeverity = "critical" | "warning";

export interface FarmAlert {
  severity: AlertSeverity;
  icon: string;
  text: string;
}

const IRRIGATION_GAP_DAYS = 3;
const SECURITY_LOOKBACK_DAYS = 14;
const MACHINERY_INCIDENT_LOOKBACK_DAYS = 14;
const SERVICE_OVERDUE_DAYS = 45;
const LOW_INVENTORY_THRESHOLD = 5;

export async function computeFarmAlerts(): Promise<FarmAlert[]> {
  const alerts: FarmAlert[] = [];

  const [lastIrrigation, openSecurity, machineryIncidents, inAgg, outAgg, lastServiceByMachine] = await Promise.all([
    prisma.irrigation.findFirst({ orderBy: { date: "desc" } }),
    prisma.security.findMany({
      where: { date: { gte: daysAgo(SECURITY_LOOKBACK_DAYS) }, OR: [{ action: null }, { action: "" }] },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.machinery.count({
      where: { date: { gte: daysAgo(MACHINERY_INCIDENT_LOOKBACK_DAYS) }, category: "⚠️ خرابی/حادثه" },
    }),
    // Net inventory per item: ورود adds, خروج subtracts (see lib/excel.ts's
    // "type" column) — there's no stored running balance, so this is only
    // as accurate as what's actually been recorded.
    prisma.inventory.groupBy({ by: ["item", "unit"], where: { type: "ورود" }, _sum: { qty: true } }),
    prisma.inventory.groupBy({ by: ["item", "unit"], where: { type: "خروج" }, _sum: { qty: true } }),
    prisma.machinery.groupBy({
      by: ["machine"],
      where: { category: "🛠 سرویس دوره‌ای" },
      _max: { date: true },
    }),
  ]);

  // Irrigation gone quiet.
  if (!lastIrrigation) {
    alerts.push({ severity: "warning", icon: "💧", text: "هنوز هیچ ثبت آبیاری‌ای در سامانه وجود ندارد." });
  } else if (lastIrrigation.date < daysAgo(IRRIGATION_GAP_DAYS)) {
    alerts.push({
      severity: "warning",
      icon: "💧",
      text: `از آخرین ثبت آبیاری (${toFa(lastIrrigation.date)}) بیش از ${toFa(IRRIGATION_GAP_DAYS)} روز گذشته است.`,
    });
  }

  // Inventory running low/negative.
  const netByItem = new Map<string, { unit: string; net: number }>();
  for (const r of inAgg) netByItem.set(r.item, { unit: r.unit, net: (netByItem.get(r.item)?.net ?? 0) + (r._sum.qty ?? 0) });
  for (const r of outAgg) netByItem.set(r.item, { unit: r.unit, net: (netByItem.get(r.item)?.net ?? 0) - (r._sum.qty ?? 0) });
  for (const [item, { unit, net }] of netByItem) {
    if (net <= LOW_INVENTORY_THRESHOLD) {
      alerts.push({
        severity: net < 0 ? "critical" : "warning",
        icon: "📦",
        text: `موجودی «${item}» ${net < 0 ? "منفی شده" : "رو به اتمام است"} (${toFa(net)} ${unit}).`,
      });
    }
  }

  // Security incidents with no recorded follow-up action.
  for (const s of openSecurity) {
    alerts.push({ severity: "critical", icon: "🛡️", text: `حادثه «${s.title}» (${toFa(s.date)}) هنوز اقدامی برایش ثبت نشده.` });
  }

  // Recent breakdown/incident events on machinery.
  if (machineryIncidents > 0) {
    alerts.push({
      severity: "critical",
      icon: "🚜",
      text: `${toFa(machineryIncidents)} رویداد «خرابی/حادثه» ماشین‌آلات در ${toFa(MACHINERY_INCIDENT_LOOKBACK_DAYS)} روز اخیر ثبت شده.`,
    });
  }

  // Machines overdue for periodic service. groupBy only returns machines
  // that have at least one "🛠 سرویس دوره‌ای" row, so a machine that's
  // never had one simply won't appear here — checked separately below
  // against the full MACHINES list.
  const overdueBefore = daysAgo(SERVICE_OVERDUE_DAYS);
  const lastServiceByName = new Map(lastServiceByMachine.map((m) => [m.machine, m._max.date]));
  for (const machine of MACHINES) {
    const last = lastServiceByName.get(machine);
    if (!last) {
      alerts.push({ severity: "warning", icon: "🛠", text: `«${machine}» هنوز هیچ سرویس دوره‌ای برایش ثبت نشده.` });
    } else if (last < overdueBefore) {
      alerts.push({
        severity: "warning",
        icon: "🛠",
        text: `«${machine}» از آخرین سرویس دوره‌ای (${toFa(last)}) بیش از ${toFa(SERVICE_OVERDUE_DAYS)} روز گذشته.`,
      });
    }
  }

  return alerts;
}
