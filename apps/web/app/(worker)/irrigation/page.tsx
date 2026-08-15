"use client";

import { useEffect, useState } from "react";
import { GuideStep } from "@/components/irrigation/guide-step";
import { ReviewStep } from "@/components/irrigation/review-step";
import { ZoneStep } from "@/components/irrigation/zone-step";
import { EditableRecordTable, type RecordColumn } from "@/components/ui/editable-record-table";
import { FieldWrap, TextInput } from "@/components/ui/fields";
import { GlassCard } from "@/components/ui/glass-card";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { ModuleHero } from "@/components/ui/module-hero";
import { isDateEditable } from "@/lib/date-policy";
import { toFa, todayJStr } from "@/lib/jalaali";
import { findModuleMeta } from "@/lib/module-meta";
import { IRRIGATION_GARDEN_TOTAL, IRRIGATION_ZONES } from "@/lib/reference-data";
import { useModuleStore } from "@/lib/store";
import type { IrrigationRecord } from "@/lib/types";

const meta = findModuleMeta("irrigation")!;

type Zone = 1 | 2 | 3 | 4;
type Step = "guide" | "zone" | "review";

export default function IrrigationPage() {
  const { rows, loaded, load, add, update, remove } = useModuleStore<IrrigationRecord>("irrigation")();
  const [date, setDate] = useState(todayJStr());
  const [worker, setWorker] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [step, setStep] = useState<Step>("guide");
  const [activeZone, setActiveZone] = useState<Zone>(1);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  // Whenever the selected date changes (or the archive finishes loading),
  // sync the wizard to that day's saved record. Adjusting state during
  // render — rather than in a useEffect — keeps this a single commit
  // instead of a stale-then-corrected flash.
  const syncKey = `${date}|${loaded}`;
  const [lastSyncKey, setLastSyncKey] = useState(syncKey);
  if (syncKey !== lastSyncKey) {
    setLastSyncKey(syncKey);
    const existing = rows.find((r) => r.date === date);
    setWorker(existing?.worker ?? "");
    setSelected(new Set(existing?.gardens ?? []));
    setStep("guide");
  }

  const locked = !isDateEditable(date);
  const count = selected.size;
  const zone = IRRIGATION_ZONES.find((z) => z.zone === activeZone)!;

  function toggleGarden(n: number) {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  function setZoneAll(z: typeof zone, on: boolean) {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      z.gardens.forEach((g) => (on ? next.add(g.n) : next.delete(g.n)));
      return next;
    });
  }

  function goToZone(z: Zone) {
    setActiveZone(z);
    setStep("zone");
  }

  async function save() {
    if (!date) return alert("تاریخ را انتخاب کنید.");
    if (locked) return alert("این روز قفل شده و دیگر قابل ثبت/ویرایش نیست.");
    const gardens = [...selected].sort((a, b) => a - b);
    const record: IrrigationRecord = { uid: date, synced: false, date, worker: worker.trim(), gardens, count: gardens.length };
    const exists = rows.some((r) => r.uid === date);
    if (exists) await update(record);
    else await add(record);
    alert(`آبیاری روز ${toFa(date)} با ${toFa(gardens.length)} باغ بایگانی شد.`);
  }

  function loadRow(row: IrrigationRecord) {
    setDate(row.date);
    setStep("guide");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const columns: RecordColumn<IrrigationRecord>[] = [
    { key: "date", label: "تاریخ", render: (r) => <span className="font-semibold">{toFa(r.date)}</span> },
    { key: "worker", label: "آبدار", render: (r) => r.worker || "—" },
    {
      key: "count",
      label: "باغ‌های آبیاری‌شده",
      render: (r) => (
        <span className="font-bold text-water-700">
          {toFa(r.count)} / {toFa(IRRIGATION_GARDEN_TOTAL)}
        </span>
      ),
    },
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
            <TextInput
              list="workers-list"
              value={worker}
              onChange={(e) => setWorker(e.target.value)}
              placeholder="نام آبدار"
              disabled={locked}
            />
          </FieldWrap>
        </div>

        {locked && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-gold-500/40 bg-gold-500/10 px-4 py-3 text-fluid-sm font-semibold text-gold-700">
            🔒 این روز قدیمی‌تر از بازه‌ی مجاز ویرایش است — فقط قابل مشاهده است.
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-water-500/30 bg-water-500/10 px-4 py-3">
          <div className="flex items-center gap-2 whitespace-nowrap font-bold text-water-700">
            💧 {toFa(count)} / {toFa(IRRIGATION_GARDEN_TOTAL)} باغ در حال آبیاری امروز
          </div>
          <div className="h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-water-400 to-water-600 transition-all duration-500"
              style={{ width: `${(count / IRRIGATION_GARDEN_TOTAL) * 100}%` }}
            />
          </div>
        </div>

        {step === "guide" && <GuideStep selected={selected} onPickZone={goToZone} onReview={() => setStep("review")} />}

        {step === "zone" && (
          <ZoneStep
            zone={zone}
            selected={selected}
            locked={locked}
            onToggle={toggleGarden}
            onSelectAll={() => setZoneAll(zone, true)}
            onClearZone={() => setZoneAll(zone, false)}
            onSwitchZone={setActiveZone}
            onBackToGuide={() => setStep("guide")}
            onReview={() => setStep("review")}
          />
        )}

        {step === "review" && (
          <ReviewStep
            selected={selected}
            locked={locked}
            onRemove={toggleGarden}
            onEditZone={goToZone}
            onBack={() => setStep("guide")}
            onSubmit={save}
          />
        )}
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
