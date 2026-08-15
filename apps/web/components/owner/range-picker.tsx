"use client";

import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { daysAgo, startOfMonth, startOfWeek } from "@/lib/date-ranges";
import { todayJStr } from "@/lib/jalaali";

const PRESETS: { label: string; get: () => readonly [string, string] }[] = [
  { label: "۷ روز اخیر", get: () => [daysAgo(7), todayJStr()] },
  { label: "این هفته", get: () => [startOfWeek(), todayJStr()] },
  { label: "این ماه", get: () => [startOfMonth(), todayJStr()] },
  { label: "۳۰ روز اخیر", get: () => [daysAgo(30), todayJStr()] },
];

/** Shared from/to Jalali range picker with quick presets — used by every
 * admin/owner page that queries data over a date range. */
export function RangePicker({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-40">
        <JalaliDatePicker value={from} onChange={(v) => onChange(v, to)} placeholder="از تاریخ" />
      </div>
      <span className="text-bark-400">تا</span>
      <div className="w-40">
        <JalaliDatePicker value={to} onChange={(v) => onChange(from, v)} placeholder="تا تاریخ" />
      </div>
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              const [f, t] = p.get();
              onChange(f, t);
            }}
            className="rounded-lg bg-sand-100 px-3 py-2 text-xs font-semibold text-bark-700 hover:bg-sand-200"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
