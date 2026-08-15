"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RangePicker } from "@/components/owner/range-picker";
import { daysAgo } from "@/lib/date-ranges";
import { money, toFa, todayJStr } from "@/lib/jalaali";
import { ChartCard, EmptyState, KpiCard } from "../owner-charts";

interface WorkerPerformance {
  worker: string;
  daysPresent: number;
  daysLeavePaid: number;
  daysLeaveUnpaid: number;
  totalDaysLogged: number;
  attendanceRate: number;
  shiftsTotal: number;
  shiftsQualityOk: number;
  qualityRate: number;
  baseShifts: number;
  lumpShifts: number;
  totalBonus: number;
}

const GRID = "#eae3d4";
const AXIS_TEXT = { fill: "#7a5736", fontSize: 12 };

export function TeamClient() {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(todayJStr());
  const [workers, setWorkers] = useState<WorkerPerformance[] | null>(null);
  const [loading, setLoading] = useState(true);

  const queryKey = `${from}:${to}`;
  const [lastQueryKey, setLastQueryKey] = useState(queryKey);
  if (queryKey !== lastQueryKey) {
    setLastQueryKey(queryKey);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/owner/team?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.ok) setWorkers(json.workers);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const totalWorkers = workers?.length ?? 0;
  const avgAttendance = workers?.length ? Math.round((workers.reduce((a, w) => a + w.attendanceRate, 0) / workers.length) * 10) / 10 : 0;
  const avgQuality = workers?.length ? Math.round((workers.reduce((a, w) => a + w.qualityRate, 0) / workers.length) * 10) / 10 : 0;
  const totalBonus = workers?.reduce((a, w) => a + w.totalBonus, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
        <h2 className="font-bold text-bark-700">👷 تحلیل عملکرد کارگران</h2>
        <div className="mr-auto flex flex-wrap items-center gap-3">
          <RangePicker
            from={from}
            to={to}
            onChange={(f, t) => {
              setFrom(f);
              setTo(t);
            }}
          />
          {loading && <span className="text-xs text-bark-400">در حال بارگذاری...</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard icon="👷" label="کارگران فعال" value={toFa(totalWorkers)} tone="#059669" />
        <KpiCard icon="📅" label="میانگین نرخ حضور" value={`${toFa(avgAttendance)}٪`} tone="#0284c7" />
        <KpiCard icon="✅" label="میانگین نرخ کیفیت" value={`${toFa(avgQuality)}٪`} tone="#b45309" />
        <KpiCard icon="🎁" label="مجموع پاداش" value={`${money(totalBonus)} ت`} tone="#69492c" />
      </div>

      <ChartCard title="نرخ حضور و کیفیت به‌تفکیک کارگر" subtitle="درصد در بازه‌ی انتخابی">
        {!workers || workers.length === 0 ? (
          <EmptyState text="در این بازه هیچ رکورد حضور و غیابی ثبت نشده است." />
        ) : (
          <ResponsiveContainer>
            <BarChart data={workers} barGap={2}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="worker" tick={AXIS_TEXT} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis tick={AXIS_TEXT} axisLine={false} tickLine={false} width={36} unit="%" />
              <Tooltip formatter={(v) => `${toFa(Number(v))}٪`} />
              <Legend />
              <Bar dataKey="attendanceRate" name="نرخ حضور" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="qualityRate" name="نرخ کیفیت" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="glass overflow-hidden rounded-2xl p-0">
        <div className="p-5 sm:p-6">
          <h3 className="mb-4 font-bold text-bark-700">جدول تفصیلی</h3>
          {!workers || workers.length === 0 ? (
            <EmptyState text="داده‌ای برای نمایش نیست." />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full text-right text-fluid-sm">
                <thead className="bg-bark-700 text-white">
                  <tr>
                    {["کارگر", "روز حاضر", "مرخصی باحقوق", "مرخصی بی‌حقوق", "نرخ حضور", "شیفت‌ها", "نرخ کیفیت", "کار پایه", "کار مقطوع", "مجموع پاداش"].map((h) => (
                      <th key={h} className="px-4 py-3 font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {workers.map((w) => (
                    <tr key={w.worker}>
                      <td data-label="کارگر" className="px-4 py-3 font-semibold">{w.worker}</td>
                      <td data-label="روز حاضر" className="px-4 py-3">{toFa(w.daysPresent)}</td>
                      <td data-label="مرخصی باحقوق" className="px-4 py-3">{toFa(w.daysLeavePaid)}</td>
                      <td data-label="مرخصی بی‌حقوق" className="px-4 py-3">{toFa(w.daysLeaveUnpaid)}</td>
                      <td data-label="نرخ حضور" className="px-4 py-3 font-bold text-leaf-700">{toFa(w.attendanceRate)}٪</td>
                      <td data-label="شیفت‌ها" className="px-4 py-3">{toFa(w.shiftsTotal)}</td>
                      <td data-label="نرخ کیفیت" className="px-4 py-3 font-bold text-water-700">{toFa(w.qualityRate)}٪</td>
                      <td data-label="کار پایه" className="px-4 py-3">{toFa(w.baseShifts)}</td>
                      <td data-label="کار مقطوع" className="px-4 py-3">{toFa(w.lumpShifts)}</td>
                      <td data-label="مجموع پاداش" className="px-4 py-3 font-bold">{money(w.totalBonus)} ت</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
