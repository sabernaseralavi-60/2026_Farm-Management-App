"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money, toFa } from "@/lib/jalaali";

interface Props {
  kpis: {
    totalIncome: number;
    totalExpense: number;
    totalWorkers: number;
    latestIrrigation: number;
    totalHarvestedKg: number;
    totalMachineHours: number;
    securityCount: number;
  };
  moneySeries: { date: string; income: number; expense: number }[];
  irrigationSeries: { date: string; coverage: number }[];
  attendanceSeries: { date: string; workers: number }[];
}

const GRID = "#eae3d4";
const AXIS_TEXT = { fill: "#7a5736", fontSize: 12 };

function KpiCard({ icon, label, value, tone }: { icon: string; label: string; value: string; tone: string }) {
  return (
    <div className="glass rounded-2xl p-5" style={{ borderTop: `3px solid ${tone}` }}>
      <div className="mb-1 flex items-center gap-2 text-fluid-sm font-semibold text-bark-600">
        <span aria-hidden>{icon}</span> {label}
      </div>
      <div className="text-fluid-xl font-extrabold text-bark-800">{value}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <h3 className="font-bold text-bark-700">{title}</h3>
      <p className="mb-4 text-fluid-xs text-bark-500">{subtitle}</p>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex h-full items-center justify-center text-fluid-sm text-bark-400">{text}</div>;
}

export function OwnerCharts({ kpis, moneySeries, irrigationSeries, attendanceSeries }: Props) {
  const balance = kpis.totalIncome - kpis.totalExpense;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard icon="💵" label="مجموع درآمد" value={`${money(kpis.totalIncome)} ت`} tone="#059669" />
        <KpiCard icon="🧾" label="مجموع هزینه" value={`${money(kpis.totalExpense)} ت`} tone="#dc2626" />
        <KpiCard icon="⚖️" label="مانده" value={`${balance < 0 ? "-" : ""}${money(Math.abs(balance))} ت`} tone="#69492c" />
        <KpiCard icon="👷" label="کارگران فعال" value={toFa(kpis.totalWorkers)} tone="#b45309" />
        <KpiCard icon="💧" label="آخرین پوشش آبیاری" value={`${toFa(Math.round((kpis.latestIrrigation / 200) * 100))}٪`} tone="#0284c7" />
        <KpiCard icon="🌾" label="مجموع برداشت" value={`${toFa(kpis.totalHarvestedKg)} kg`} tone="#d97706" />
        <KpiCard icon="🚜" label="ساعات کارکرد ماشین‌آلات" value={toFa(Math.round(kpis.totalMachineHours))} tone="#7a5736" />
        <KpiCard icon="🛡️" label="حوادث امنیتی ثبت‌شده" value={toFa(kpis.securityCount)} tone="#475569" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="روند درآمد / هزینه" subtitle="۱۴ روز اخیر دارای تراکنش">
          {moneySeries.length === 0 ? (
            <EmptyState text="هنوز تراکنش مالی ثبت نشده است." />
          ) : (
            <ResponsiveContainer>
              <BarChart data={moneySeries} barGap={2}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tickFormatter={toFa} tick={AXIS_TEXT} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis tick={AXIS_TEXT} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => `${money(Number(v))} تومان`} labelFormatter={(l) => toFa(l)} />
                <Legend />
                <Bar dataKey="income" name="درآمد" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="expense" name="هزینه" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="روند پوشش آبیاری" subtitle="درصد آبریزهای آبیاری‌شده از ۲۰۰ مورد">
          {irrigationSeries.length === 0 ? (
            <EmptyState text="هنوز آبیاری‌ای بایگانی نشده است." />
          ) : (
            <ResponsiveContainer>
              <LineChart data={irrigationSeries}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tickFormatter={toFa} tick={AXIS_TEXT} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis tick={AXIS_TEXT} axisLine={false} tickLine={false} width={36} unit="%" />
                <Tooltip formatter={(v) => `${toFa(Number(v))}٪`} labelFormatter={(l) => toFa(l)} />
                <Line type="monotone" dataKey="coverage" name="پوشش آبیاری" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="روند حضور کارگران" subtitle="تعداد کارگران حاضر در هر روز">
          {attendanceSeries.length === 0 ? (
            <EmptyState text="هنوز حضور و غیابی ثبت نشده است." />
          ) : (
            <ResponsiveContainer>
              <LineChart data={attendanceSeries}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tickFormatter={toFa} tick={AXIS_TEXT} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis tick={AXIS_TEXT} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip formatter={(v) => toFa(Number(v))} labelFormatter={(l) => toFa(l)} />
                <Line type="monotone" dataKey="workers" name="کارگران حاضر" stroke="#69492c" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
