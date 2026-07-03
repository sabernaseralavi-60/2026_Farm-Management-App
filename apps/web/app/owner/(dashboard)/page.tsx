import { prisma } from "@/lib/prisma";
import { OwnerCharts } from "./owner-charts";

async function loadDashboardData() {
  const [accountingRows, irrigationRows, attendanceRows, securityCount, harvestRows, machineryRows] = await Promise.all([
    prisma.accounting.findMany({ orderBy: { date: "desc" }, take: 200 }),
    prisma.irrigation.findMany({ orderBy: { date: "desc" }, take: 30 }),
    prisma.attendance.findMany({ orderBy: { date: "desc" }, take: 300 }),
    prisma.security.count(),
    prisma.harvest.findMany(),
    prisma.machinery.findMany(),
  ]);

  const totalIncome = accountingRows.filter((r) => r.type === "درآمد").reduce((a, r) => a + r.amount, 0);
  const totalExpense = accountingRows.filter((r) => r.type === "هزینه").reduce((a, r) => a + r.amount, 0);
  const totalWorkers = new Set(attendanceRows.map((r) => r.worker)).size;
  const totalHarvestedKg = harvestRows.reduce((a, r) => a + (r.harvested ?? 0), 0);
  const totalMachineHours = machineryRows.reduce((a, r) => a + (r.usefulHours ?? 0), 0);
  const latestIrrigation = irrigationRows[0]?.count ?? 0;

  const moneyByDate = new Map<string, { date: string; income: number; expense: number }>();
  for (const r of accountingRows) {
    const cur = moneyByDate.get(r.date) ?? { date: r.date, income: 0, expense: 0 };
    if (r.type === "درآمد") cur.income += r.amount;
    else cur.expense += r.amount;
    moneyByDate.set(r.date, cur);
  }
  const moneySeries = [...moneyByDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-14);

  const irrigationSeries = [...irrigationRows]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-14)
    .map((r) => ({ date: r.date, coverage: Math.round((r.count / 200) * 100) }));

  const attendanceByDate = new Map<string, Set<string>>();
  for (const r of attendanceRows) {
    if (r.status !== "present") continue;
    const set = attendanceByDate.get(r.date) ?? new Set<string>();
    set.add(r.worker);
    attendanceByDate.set(r.date, set);
  }
  const attendanceSeries = [...attendanceByDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-14)
    .map(([date, workers]) => ({ date, workers: workers.size }));

  return {
    kpis: { totalIncome, totalExpense, totalWorkers, latestIrrigation, totalHarvestedKg, totalMachineHours, securityCount },
    moneySeries,
    irrigationSeries,
    attendanceSeries,
  };
}

export default async function OwnerDashboardPage() {
  const data = await loadDashboardData();
  return <OwnerCharts {...data} />;
}
