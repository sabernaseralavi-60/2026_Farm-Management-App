import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IRRIGATION_GARDEN_TOTAL } from "@/lib/reference-data";
import { getOwnerSession } from "@/lib/session";

function moneyFromAccounting(rows: { type: string; amount: number }[]) {
  let income = 0;
  let expense = 0;
  for (const r of rows) {
    if (r.type === "درآمد") income += r.amount;
    else expense += r.amount;
  }
  return { income, expense };
}

export async function GET(request: Request) {
  const session = await getOwnerSession();
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") === "range" ? "range" : "day";

  if (mode === "day") {
    const date = searchParams.get("date");
    if (!date) return NextResponse.json({ ok: false, error: "date is required" }, { status: 400 });

    const [attendance, machinery, irrigation, spray, orchard, inventory, accounting, harvest, sheep, security] = await Promise.all([
      prisma.attendance.findMany({ where: { date }, orderBy: { worker: "asc" } }),
      prisma.machinery.findMany({ where: { date } }),
      prisma.irrigation.findUnique({ where: { date } }),
      prisma.pestFertilizer.findMany({ where: { date } }),
      prisma.orchard.findMany({ where: { date } }),
      prisma.inventory.findMany({ where: { date } }),
      prisma.accounting.findMany({ where: { date } }),
      prisma.harvest.findMany({ where: { date } }),
      prisma.sheep.findMany({ where: { date } }),
      prisma.security.findMany({ where: { date } }),
    ]);

    const { income, expense } = moneyFromAccounting(accounting);
    const workersPresent = attendance.filter((r) => r.status === "present").length;
    const workersOnLeave = attendance.filter((r) => r.status === "leave").length;
    const machineHours = machinery.reduce((a, r) => a + (r.usefulHours ?? 0), 0);
    const harvestedKg = harvest.reduce((a, r) => a + (r.harvested ?? 0), 0);

    return NextResponse.json({
      ok: true,
      date,
      kpis: {
        workersPresent,
        workersOnLeave,
        machineHours: Math.round(machineHours * 10) / 10,
        irrigationCoverage: irrigation ? Math.round((irrigation.count / IRRIGATION_GARDEN_TOTAL) * 100) : null,
        income,
        expense,
        harvestedKg,
        securityIncidents: security.length,
      },
      attendance,
      machinery,
      irrigation,
      spray,
      orchard,
      inventory,
      accounting,
      harvest,
      sheep,
      security,
    });
  }

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) return NextResponse.json({ ok: false, error: "from/to are required" }, { status: 400 });
  const range = { gte: from, lte: to };

  const [attendance, machinery, irrigation, accounting, harvest, sheep, security, orchard, spray, inventory] = await Promise.all([
    prisma.attendance.findMany({ where: { date: range } }),
    prisma.machinery.findMany({ where: { date: range } }),
    prisma.irrigation.findMany({ where: { date: range }, orderBy: { date: "asc" } }),
    prisma.accounting.findMany({ where: { date: range } }),
    prisma.harvest.findMany({ where: { date: range } }),
    prisma.sheep.findMany({ where: { date: range } }),
    prisma.security.findMany({ where: { date: range } }),
    prisma.orchard.findMany({ where: { date: range } }),
    prisma.pestFertilizer.findMany({ where: { date: range } }),
    prisma.inventory.findMany({ where: { date: range } }),
  ]);

  const { income, expense } = moneyFromAccounting(accounting);
  const machineHours = machinery.reduce((a, r) => a + (r.usefulHours ?? 0), 0);
  const harvestedKg = harvest.reduce((a, r) => a + (r.harvested ?? 0), 0);
  const distinctWorkers = new Set(attendance.filter((r) => r.status === "present").map((r) => r.worker)).size;
  const avgIrrigationCoverage = irrigation.length
    ? Math.round((irrigation.reduce((a, r) => a + r.count, 0) / irrigation.length / IRRIGATION_GARDEN_TOTAL) * 100)
    : null;

  const moneyByDate = new Map<string, { date: string; income: number; expense: number }>();
  for (const r of accounting) {
    const cur = moneyByDate.get(r.date) ?? { date: r.date, income: 0, expense: 0 };
    if (r.type === "درآمد") cur.income += r.amount;
    else cur.expense += r.amount;
    moneyByDate.set(r.date, cur);
  }
  const moneySeries = [...moneyByDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));

  const irrigationSeries = irrigation.map((r) => ({ date: r.date, coverage: Math.round((r.count / IRRIGATION_GARDEN_TOTAL) * 100) }));

  const attendanceByDate = new Map<string, Set<string>>();
  for (const r of attendance) {
    if (r.status !== "present") continue;
    const set = attendanceByDate.get(r.date) ?? new Set<string>();
    set.add(r.worker);
    attendanceByDate.set(r.date, set);
  }
  const attendanceSeries = [...attendanceByDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, workers]) => ({ date, workers: workers.size }));

  return NextResponse.json({
    ok: true,
    range: { from, to },
    kpis: {
      totalIncome: income,
      totalExpense: expense,
      totalWorkers: distinctWorkers,
      avgIrrigationCoverage,
      totalHarvestedKg: harvestedKg,
      totalMachineHours: Math.round(machineHours * 10) / 10,
      securityIncidents: security.length,
      orchardTasks: orchard.length,
      sprayOps: spray.length,
      inventoryTx: inventory.length,
      sheepEvents: sheep.length,
    },
    moneySeries,
    irrigationSeries,
    attendanceSeries,
  });
}
