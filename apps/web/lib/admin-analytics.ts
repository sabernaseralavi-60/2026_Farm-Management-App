import { prisma } from "./prisma";

/** Per-worker attendance + quality + bonus rollup over a date range — the
 * data behind the admin "تحلیل عملکرد کارگران" page and fed to the AI
 * Q&A tool as ground truth (the LLM narrates these numbers, it never
 * invents its own). */
export interface WorkerPerformance {
  worker: string;
  daysPresent: number;
  daysLeavePaid: number;
  daysLeaveUnpaid: number;
  totalDaysLogged: number;
  attendanceRate: number; // % of logged days marked present
  shiftsTotal: number;
  shiftsQualityOk: number;
  qualityRate: number; // % of shifts with quality confirmed
  baseShifts: number;
  lumpShifts: number;
  totalBonus: number;
}

export async function computeWorkerPerformance(from: string, to: string): Promise<WorkerPerformance[]> {
  const rows = await prisma.attendance.findMany({ where: { date: { gte: from, lte: to } } });

  const byWorker = new Map<string, WorkerPerformance>();
  function bucket(worker: string): WorkerPerformance {
    let e = byWorker.get(worker);
    if (!e) {
      e = {
        worker,
        daysPresent: 0,
        daysLeavePaid: 0,
        daysLeaveUnpaid: 0,
        totalDaysLogged: 0,
        attendanceRate: 0,
        shiftsTotal: 0,
        shiftsQualityOk: 0,
        qualityRate: 0,
        baseShifts: 0,
        lumpShifts: 0,
        totalBonus: 0,
      };
      byWorker.set(worker, e);
    }
    return e;
  }

  for (const r of rows) {
    const e = bucket(r.worker);
    e.totalDaysLogged += 1;
    if (r.status === "present") e.daysPresent += 1;
    else if (r.leaveType === "paid") e.daysLeavePaid += 1;
    else e.daysLeaveUnpaid += 1;

    const shifts = [
      { type: r.morningType, ok: r.morningOk, bonus: r.morningBonus },
      { type: r.eveningType, ok: r.eveningOk, bonus: r.eveningBonus },
    ];
    for (const s of shifts) {
      if (!s.type) continue;
      e.shiftsTotal += 1;
      if (s.ok) e.shiftsQualityOk += 1;
      if (s.type === "lump") e.lumpShifts += 1;
      else e.baseShifts += 1;
      e.totalBonus += s.bonus ?? 0;
    }
  }

  const list = [...byWorker.values()];
  for (const e of list) {
    e.attendanceRate = e.totalDaysLogged ? Math.round((e.daysPresent / e.totalDaysLogged) * 1000) / 10 : 0;
    e.qualityRate = e.shiftsTotal ? Math.round((e.shiftsQualityOk / e.shiftsTotal) * 1000) / 10 : 0;
  }
  list.sort((a, b) => b.daysPresent - a.daysPresent || a.worker.localeCompare(b.worker));
  return list;
}

function topGroups<T>(rows: T[], keyFn: (r: T) => string, valFn: (r: T) => number, limit = 12) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = keyFn(r) || "نامشخص";
    m.set(k, (m.get(k) ?? 0) + valFn(r));
  }
  return [...m.entries()]
    .map(([key, value]) => ({ key, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/** A compact, pre-aggregated snapshot of the whole farm over a date range —
 * every number here comes straight from real rollup queries, never from the
 * LLM. This is what gets serialized into the AI Q&A prompt as ground truth. */
export interface AdminSnapshot {
  range: { from: string; to: string };
  workerPerformance: WorkerPerformance[];
  money: { income: number; expense: number; byCategory: { key: string; value: number }[] };
  irrigation: { daysLogged: number; avgGardensPerDay: number; maxGardensInADay: number; totalGardenTouches: number };
  orchard: { total: number; byStatus: { key: string; value: number }[]; byTask: { key: string; value: number }[] };
  spray: { total: number; byOp: { key: string; value: number }[] };
  inventory: { total: number; inCount: number; outCount: number; byItem: { key: string; value: number }[] };
  harvest: { totalHarvestedKg: number; totalSoldKg: number; totalRevenue: number; byProduct: { key: string; value: number }[] };
  sheep: { totalCount: number; byCategory: { key: string; value: number }[] };
  security: { total: number; recent: { date: string; type: string; title: string }[] };
  machinery: { totalHours: number; byMachine: { key: string; value: number }[] };
}

export async function buildAdminSnapshot(from: string, to: string): Promise<AdminSnapshot> {
  const range = { gte: from, lte: to };
  const [workerPerformance, accounting, irrigation, orchard, spray, inventory, harvest, sheep, security, machinery] =
    await Promise.all([
      computeWorkerPerformance(from, to),
      prisma.accounting.findMany({ where: { date: range } }),
      prisma.irrigation.findMany({ where: { date: range } }),
      prisma.orchard.findMany({ where: { date: range } }),
      prisma.pestFertilizer.findMany({ where: { date: range } }),
      prisma.inventory.findMany({ where: { date: range } }),
      prisma.harvest.findMany({ where: { date: range } }),
      prisma.sheep.findMany({ where: { date: range } }),
      prisma.security.findMany({ where: { date: range }, orderBy: { date: "desc" }, take: 20 }),
      prisma.machinery.findMany({ where: { date: range } }),
    ]);

  const income = accounting.filter((r) => r.type === "درآمد").reduce((a, r) => a + r.amount, 0);
  const expense = accounting.filter((r) => r.type === "هزینه").reduce((a, r) => a + r.amount, 0);

  const gardenCounts = irrigation.map((r) => r.count);

  return {
    range: { from, to },
    workerPerformance,
    money: {
      income,
      expense,
      byCategory: topGroups(accounting, (r) => `${r.type} — ${r.category}`, (r) => r.amount),
    },
    irrigation: {
      daysLogged: irrigation.length,
      avgGardensPerDay: gardenCounts.length ? Math.round((gardenCounts.reduce((a, c) => a + c, 0) / gardenCounts.length) * 10) / 10 : 0,
      maxGardensInADay: gardenCounts.length ? Math.max(...gardenCounts) : 0,
      totalGardenTouches: gardenCounts.reduce((a, c) => a + c, 0),
    },
    orchard: {
      total: orchard.length,
      byStatus: topGroups(orchard, (r) => r.status, () => 1),
      byTask: topGroups(orchard, (r) => r.task, () => 1),
    },
    spray: {
      total: spray.length,
      byOp: topGroups(spray, (r) => r.op, () => 1),
    },
    inventory: {
      total: inventory.length,
      inCount: inventory.filter((r) => r.type === "ورود").length,
      outCount: inventory.filter((r) => r.type === "خروج").length,
      byItem: topGroups(inventory, (r) => r.item, (r) => r.qty),
    },
    harvest: {
      totalHarvestedKg: harvest.reduce((a, r) => a + (r.harvested ?? 0), 0),
      totalSoldKg: harvest.reduce((a, r) => a + (r.sold ?? 0), 0),
      totalRevenue: harvest.reduce((a, r) => a + (r.sold ?? 0) * (r.price ?? 0), 0),
      byProduct: topGroups(harvest, (r) => r.product, (r) => r.harvested ?? 0),
    },
    sheep: {
      totalCount: sheep.reduce((a, r) => a + r.count, 0),
      byCategory: topGroups(sheep, (r) => r.category, (r) => r.count),
    },
    security: {
      total: security.length,
      recent: security.map((r) => ({ date: r.date, type: r.type, title: r.title })),
    },
    machinery: {
      totalHours: Math.round(machinery.reduce((a, r) => a + (r.usefulHours ?? 0), 0) * 10) / 10,
      byMachine: topGroups(machinery, (r) => r.machine, (r) => r.usefulHours ?? 0),
    },
  };
}
