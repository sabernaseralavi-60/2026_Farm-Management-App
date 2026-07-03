"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EditableRecordTable, type RecordColumn } from "@/components/ui/editable-record-table";
import { FieldWrap, Select, TextInput } from "@/components/ui/fields";
import { GlassCard } from "@/components/ui/glass-card";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { ModuleHero } from "@/components/ui/module-hero";
import { toFa, todayJStr } from "@/lib/jalaali";
import { findModuleMeta } from "@/lib/module-meta";
import { SHEEP_CATS, genUid } from "@/lib/reference-data";
import { useModuleStore } from "@/lib/store";
import type { SheepRecord } from "@/lib/types";

const meta = findModuleMeta("sheep")!;

function emptyForm(): SheepRecord {
  return { uid: "", synced: false, date: todayJStr(), category: SHEEP_CATS[0], count: "", amount: "", person: "", desc: "" };
}

const POSITIVE = new Set(["تولد بره/بزغاله", "خرید دام"]);
const NEGATIVE = new Set(["تلفات", "فروش دام"]);

export default function SheepPage() {
  const { rows, loaded, load, add, update, remove } = useModuleStore<SheepRecord>("sheep")();
  const [form, setForm] = useState<SheepRecord>(emptyForm());
  const [editingUid, setEditingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  function resetForm() {
    setForm(emptyForm());
    setEditingUid(null);
  }
  function startEdit(row: SheepRecord) {
    setForm(row);
    setEditingUid(row.uid);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return alert("لطفاً تاریخ را وارد کنید.");
    const record: SheepRecord = { ...form, uid: editingUid ?? genUid(), synced: false };
    if (editingUid) await update(record);
    else await add(record);
    resetForm();
  }

  const stats = useMemo(() => {
    let total = 0;
    let births = 0;
    let deaths = 0;
    for (const r of rows) {
      const c = Number(r.count) || 0;
      if (r.category === "تولد بره/بزغاله") births += c;
      if (r.category === "تلفات") deaths += c;
      if (POSITIVE.has(r.category)) total += c;
      if (NEGATIVE.has(r.category)) total -= c;
    }
    return { total, births, deaths };
  }, [rows]);

  const columns: RecordColumn<SheepRecord>[] = [
    { key: "date", label: "تاریخ", render: (r) => toFa(r.date) },
    { key: "category", label: "دسته‌بندی", render: (r) => <span className="font-semibold">{r.category}</span> },
    { key: "count", label: "تعداد", render: (r) => (r.count === "" ? "—" : toFa(r.count)) },
    { key: "amount", label: "مبلغ", render: (r) => (r.amount === "" || r.amount == null ? "—" : toFa(r.amount) + " تومان") },
    { key: "person", label: "مسئول", render: (r) => r.person || "—" },
  ];

  return (
    <section className="animate-fade-in-up">
      <ModuleHero icon={meta.icon} title={meta.title} subtitle={meta.subtitle} from={meta.from} to={meta.to} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gold-500/30 bg-gold-500/10 p-5">
          <div className="mb-1 text-fluid-sm font-semibold text-gold-700">🐑 تعداد کل دام زنده (برآوردی)</div>
          <div className="text-fluid-xl font-extrabold text-gold-700">{toFa(stats.total)}</div>
        </div>
        <div className="rounded-2xl border border-leaf-500/30 bg-leaf-500/10 p-5">
          <div className="mb-1 text-fluid-sm font-semibold text-leaf-700">🎂 کل تولدها</div>
          <div className="text-fluid-xl font-extrabold text-leaf-700">{toFa(stats.births)}</div>
        </div>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <div className="mb-1 text-fluid-sm font-semibold text-red-600">💀 کل تلفات</div>
          <div className="text-fluid-xl font-extrabold text-red-600">{toFa(stats.deaths)}</div>
        </div>
      </div>

      <GlassCard className="mb-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FieldWrap label="تاریخ">
              <JalaliDatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            </FieldWrap>
            <FieldWrap label="دسته‌بندی">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {SHEEP_CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap label="تعداد">
              <TextInput type="number" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="تعداد رأس" />
            </FieldWrap>
            <FieldWrap label="مبلغ مالی (تومان)">
              <TextInput type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="اختیاری" />
            </FieldWrap>
            <FieldWrap label="مسئول">
              <TextInput list="workers-list" value={form.person} onChange={(e) => setForm({ ...form, person: e.target.value })} placeholder="نام مسئول" />
            </FieldWrap>
            <FieldWrap label="توضیحات" className="sm:col-span-3">
              <TextInput value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="توضیحات اختیاری" />
            </FieldWrap>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" size="lg">
              {editingUid ? "💾 بروزرسانی رکورد" : "➕ ثبت رویداد دامداری"}
            </Button>
            {editingUid && (
              <Button type="button" variant="soft" size="lg" onClick={resetForm}>
                انصراف از ویرایش
              </Button>
            )}
          </div>
        </form>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-5 sm:p-6">
          <EditableRecordTable
            columns={columns}
            rows={[...rows].sort((a, b) => (a.date < b.date ? 1 : -1))}
            emptyText="هنوز رکوردی ثبت نشده است."
            onEdit={startEdit}
            onDelete={(uid) => remove(uid)}
          />
        </div>
      </GlassCard>
    </section>
  );
}
