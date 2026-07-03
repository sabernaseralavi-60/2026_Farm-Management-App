"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EditableRecordTable, type RecordColumn } from "@/components/ui/editable-record-table";
import { FieldWrap, TextInput } from "@/components/ui/fields";
import { GlassCard } from "@/components/ui/glass-card";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { ModuleHero } from "@/components/ui/module-hero";
import { toFa, todayJStr } from "@/lib/jalaali";
import { findModuleMeta } from "@/lib/module-meta";
import { IRRIGATION_TOTAL } from "@/lib/reference-data";
import { useModuleStore } from "@/lib/store";
import type { IrrigationRecord } from "@/lib/types";

const meta = findModuleMeta("irrigation")!;

export default function IrrigationPage() {
  const { rows, loaded, load, add, update, remove } = useModuleStore<IrrigationRecord>("irrigation")();
  const [date, setDate] = useState(todayJStr());
  const [worker, setWorker] = useState("");
  const [state, setState] = useState<number[]>(() => new Array(IRRIGATION_TOTAL).fill(0));
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  // Whenever the selected date changes (or the archive finishes loading),
  // sync the editable grid to that day's saved record. Adjusting state
  // during render — rather than in a useEffect — keeps this a single commit
  // instead of a stale-then-corrected flash, and the grid stays user-editable
  // afterwards (this isn't a pure derived value).
  const syncKey = `${date}|${loaded}`;
  const [lastSyncKey, setLastSyncKey] = useState(syncKey);
  if (syncKey !== lastSyncKey) {
    setLastSyncKey(syncKey);
    const existing = rows.find((r) => r.date === date);
    setWorker(existing?.worker ?? "");
    setState(existing ? existing.state.slice() : new Array(IRRIGATION_TOTAL).fill(0));
  }

  const count = useMemo(() => state.reduce((a, b) => a + b, 0), [state]);

  function toggleCell(i: number) {
    setState((s) => s.map((v, idx) => (idx === i ? (v ? 0 : 1) : v)));
  }

  function applyRange() {
    let f = parseInt(rangeFrom, 10);
    let t = parseInt(rangeTo, 10);
    if (Number.isNaN(f) || Number.isNaN(t)) return alert("بازه را به‌درستی وارد کنید.");
    if (f > t) [f, t] = [t, f];
    f = Math.max(1, f);
    t = Math.min(IRRIGATION_TOTAL, t);
    setState((s) => s.map((v, idx) => (idx + 1 >= f && idx + 1 <= t ? 1 : v)));
  }

  function clearAll() {
    setState(new Array(IRRIGATION_TOTAL).fill(0));
  }

  async function save() {
    if (!date) return alert("تاریخ را انتخاب کنید.");
    const record: IrrigationRecord = { uid: date, synced: false, date, worker: worker.trim(), state: state.slice(), count };
    const exists = rows.some((r) => r.uid === date);
    if (exists) await update(record);
    else await add(record);
    alert(`آبیاری روز ${date} بایگانی شد.`);
  }

  function loadRow(row: IrrigationRecord) {
    setDate(row.date);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const columns: RecordColumn<IrrigationRecord>[] = [
    { key: "date", label: "تاریخ", render: (r) => <span className="font-semibold">{toFa(r.date)}</span> },
    { key: "worker", label: "آبدار", render: (r) => r.worker || "—" },
    { key: "count", label: "تعداد آبیاری‌شده", render: (r) => <span className="font-bold text-water-700">{toFa(r.count)} / {toFa(IRRIGATION_TOTAL)}</span> },
  ];

  return (
    <section className="animate-fade-in-up">
      <ModuleHero icon={meta.icon} title={meta.title} subtitle={meta.subtitle} from={meta.from} to={meta.to} />

      <GlassCard className="mb-6">
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrap label="تاریخ">
            <JalaliDatePicker value={date} onChange={setDate} />
          </FieldWrap>
          <FieldWrap label="نام آبدار شیفت">
            <TextInput list="workers-list" value={worker} onChange={(e) => setWorker(e.target.value)} placeholder="نام آبدار" />
          </FieldWrap>
        </div>

        <div className="mb-5 rounded-2xl border border-water-500/30 bg-water-500/10 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <FieldWrap label="از آبریز">
              <TextInput type="number" min={1} max={IRRIGATION_TOTAL} value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} className="w-24" placeholder="۱۰" />
            </FieldWrap>
            <FieldWrap label="تا آبریز">
              <TextInput type="number" min={1} max={IRRIGATION_TOTAL} value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} className="w-24" placeholder="۵۰" />
            </FieldWrap>
            <Button type="button" variant="water" onClick={applyRange}>💧 انتخاب بازه‌ای</Button>
            <Button type="button" variant="soft" onClick={clearAll}>🧹 پاک کردن</Button>
            <div className="mr-auto flex items-center gap-2 rounded-xl border border-water-500/30 bg-white px-4 py-2.5 font-semibold text-water-700">
              💧 آبیاری‌شده: {toFa(count)} / {toFa(IRRIGATION_TOTAL)}
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(42px,1fr))] gap-2">
          {state.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleCell(i)}
              className={
                "aspect-square rounded-xl border text-xs font-bold transition-all " +
                (v
                  ? "scale-105 border-water-700 bg-gradient-to-br from-water-400 to-water-600 text-white shadow-[0_0_0_3px_rgba(14,165,233,.18),0_6px_14px_rgba(2,132,199,.35)]"
                  : "border-sand-300 bg-sand-200/70 text-bark-500 hover:-translate-y-0.5")
              }
            >
              {toFa(i + 1)}
            </button>
          ))}
        </div>

        <Button type="button" size="lg" className="w-full" onClick={save}>
          💾 ثبت / به‌روزرسانی آبیاری این روز
        </Button>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-5 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-water-700">🕘 بایگانی روزهای آبیاری</h3>
          <EditableRecordTable
            columns={columns}
            rows={[...rows].sort((a, b) => (a.date < b.date ? 1 : -1))}
            emptyText="هنوز روزی بایگانی نشده است."
            onEdit={loadRow}
            onDelete={(uid) => remove(uid)}
          />
        </div>
      </GlassCard>
    </section>
  );
}
