"use client";

import { useEffect, useState } from "react";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { d2j, j2d, jalaaliWeekday, money, pad2, parseJalaaliStr, toFa, todayJStr } from "@/lib/jalaali";
import { DailyDigest, type DayData } from "./daily-digest";
import { KpiCard, RangeCharts } from "./owner-charts";

type RangeData = {
  range: { from: string; to: string };
  kpis: {
    totalIncome: number;
    totalExpense: number;
    totalWorkers: number;
    avgIrrigationCoverage: number | null;
    totalHarvestedKg: number;
    totalMachineHours: number;
    securityIncidents: number;
    orchardTasks: number;
    sprayOps: number;
    inventoryTx: number;
    sheepEvents: number;
  };
  moneySeries: { date: string; income: number; expense: number }[];
  irrigationSeries: { date: string; coverage: number }[];
  attendanceSeries: { date: string; workers: number }[];
};

function daysAgo(n: number): string {
  const t = parseJalaaliStr(todayJStr())!;
  const jdn = j2d(t.jy, t.jm, t.jd) - n;
  const j = d2j(jdn);
  return `${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`;
}

function startOfMonth(): string {
  const t = parseJalaaliStr(todayJStr())!;
  return `${t.jy}/${pad2(t.jm)}/01`;
}

function startOfWeek(): string {
  const t = parseJalaaliStr(todayJStr())!;
  const jdn = j2d(t.jy, t.jm, t.jd);
  const weekday = jalaaliWeekday(t.jy, t.jm, t.jd);
  const j = d2j(jdn - weekday);
  return `${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`;
}

export function OwnerDashboardClient() {
  const [mode, setMode] = useState<"day" | "range">("day");
  const [day, setDay] = useState(todayJStr());
  const [from, setFrom] = useState(daysAgo(7));
  const [to, setTo] = useState(todayJStr());
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [rangeData, setRangeData] = useState<RangeData | null>(null);
  const [loading, setLoading] = useState(true);

  // Flip into a loading state as soon as the query changes (adjusting state
  // during render, not in the effect below, so the fetch effect only ever
  // calls setState from its async callbacks).
  const queryKey = mode === "day" ? `day:${day}` : `range:${from}:${to}`;
  const [lastQueryKey, setLastQueryKey] = useState(queryKey);
  if (queryKey !== lastQueryKey) {
    setLastQueryKey(queryKey);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    const url = mode === "day" ? `/api/owner/dashboard?mode=day&date=${encodeURIComponent(day)}` : `/api/owner/dashboard?mode=range&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (mode === "day") setDayData(json);
        else setRangeData(json);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [mode, day, from, to]);

  return (
    <div className="space-y-6">
      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
        <div className="flex overflow-hidden rounded-xl border border-sand-300">
          <button
            type="button"
            onClick={() => setMode("day")}
            className={`px-4 py-2 text-fluid-sm font-bold ${mode === "day" ? "bg-leaf-600 text-white" : "bg-white text-bark-600"}`}
          >
            📅 نمای روزانه
          </button>
          <button
            type="button"
            onClick={() => setMode("range")}
            className={`px-4 py-2 text-fluid-sm font-bold ${mode === "range" ? "bg-leaf-600 text-white" : "bg-white text-bark-600"}`}
          >
            📊 بازه‌ی زمانی
          </button>
        </div>

        {mode === "day" ? (
          <div className="flex items-center gap-2">
            <div className="w-44">
              <JalaliDatePicker value={day} onChange={setDay} />
            </div>
            <button type="button" onClick={() => setDay(todayJStr())} className="rounded-lg bg-sand-100 px-3 py-2 text-xs font-semibold text-bark-700 hover:bg-sand-200">
              امروز
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-40">
              <JalaliDatePicker value={from} onChange={setFrom} placeholder="از تاریخ" />
            </div>
            <span className="text-bark-400">تا</span>
            <div className="w-40">
              <JalaliDatePicker value={to} onChange={setTo} placeholder="تا تاریخ" />
            </div>
            <div className="flex gap-1">
              {[
                { label: "۷ روز اخیر", onClick: () => { setFrom(daysAgo(7)); setTo(todayJStr()); } },
                { label: "این هفته", onClick: () => { setFrom(startOfWeek()); setTo(todayJStr()); } },
                { label: "این ماه", onClick: () => { setFrom(startOfMonth()); setTo(todayJStr()); } },
                { label: "۳۰ روز اخیر", onClick: () => { setFrom(daysAgo(30)); setTo(todayJStr()); } },
              ].map((p) => (
                <button key={p.label} type="button" onClick={p.onClick} className="rounded-lg bg-sand-100 px-3 py-2 text-xs font-semibold text-bark-700 hover:bg-sand-200">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <span className="mr-auto text-xs text-bark-400">در حال بارگذاری...</span>}
      </div>

      {mode === "day" && dayData && <DailyDigest data={dayData} />}

      {mode === "range" && rangeData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <KpiCard icon="💵" label="مجموع درآمد" value={`${money(rangeData.kpis.totalIncome)} ت`} tone="#059669" />
            <KpiCard icon="🧾" label="مجموع هزینه" value={`${money(rangeData.kpis.totalExpense)} ت`} tone="#dc2626" />
            <KpiCard
              icon="⚖️"
              label="مانده"
              value={`${money(rangeData.kpis.totalIncome - rangeData.kpis.totalExpense)} ت`}
              tone="#69492c"
            />
            <KpiCard icon="👷" label="کارگران فعال" value={toFa(rangeData.kpis.totalWorkers)} tone="#b45309" />
            <KpiCard
              icon="💧"
              label="میانگین پوشش آبیاری"
              value={rangeData.kpis.avgIrrigationCoverage === null ? "—" : `${toFa(rangeData.kpis.avgIrrigationCoverage)}٪`}
              tone="#0284c7"
            />
            <KpiCard icon="🌾" label="مجموع برداشت" value={`${toFa(rangeData.kpis.totalHarvestedKg)} kg`} tone="#d97706" />
            <KpiCard icon="🚜" label="ساعات کارکرد ماشین‌آلات" value={toFa(rangeData.kpis.totalMachineHours)} tone="#7a5736" />
            <KpiCard icon="🛡️" label="حوادث امنیتی" value={toFa(rangeData.kpis.securityIncidents)} tone="#475569" />
          </div>
          <RangeCharts moneySeries={rangeData.moneySeries} irrigationSeries={rangeData.irrigationSeries} attendanceSeries={rangeData.attendanceSeries} />
        </div>
      )}
    </div>
  );
}
