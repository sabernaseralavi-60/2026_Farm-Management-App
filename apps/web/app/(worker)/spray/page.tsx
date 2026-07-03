"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EditableRecordTable, type RecordColumn } from "@/components/ui/editable-record-table";
import { FieldWrap, Select, TextInput } from "@/components/ui/fields";
import { GlassCard } from "@/components/ui/glass-card";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { ModuleHero } from "@/components/ui/module-hero";
import { EDITABLE_DAYS_BACK, isDateEditable } from "@/lib/date-policy";
import { toFa, todayJStr } from "@/lib/jalaali";
import { findModuleMeta } from "@/lib/module-meta";
import { GARDENS, SPRAY_OPS, genUid } from "@/lib/reference-data";
import { useModuleStore } from "@/lib/store";
import type { PestFertilizerRecord } from "@/lib/types";

const meta = findModuleMeta("spray")!;
const SPRAY_GARDENS = ["کل مزرعه", ...GARDENS];

function emptyForm(): PestFertilizerRecord {
  return {
    uid: "",
    synced: false,
    date: todayJStr(),
    garden: SPRAY_GARDENS[0],
    op: SPRAY_OPS[0],
    material: "",
    dose: "",
    target: "",
    operator: "",
    note: "",
  };
}

export default function SprayPage() {
  const { rows, loaded, load, add, update, remove } = useModuleStore<PestFertilizerRecord>("pest_fertilizer")();
  const [form, setForm] = useState<PestFertilizerRecord>(emptyForm());
  const [editingUid, setEditingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  function resetForm() {
    setForm(emptyForm());
    setEditingUid(null);
  }
  function startEdit(row: PestFertilizerRecord) {
    setForm(row);
    setEditingUid(row.uid);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return alert("لطفاً تاریخ را وارد کنید.");
    if (!isDateEditable(form.date)) return alert(`فقط می‌توانید برای امروز یا ${EDITABLE_DAYS_BACK} روز اخیر ثبت/ویرایش کنید.`);
    const record: PestFertilizerRecord = { ...form, uid: editingUid ?? genUid(), synced: false };
    if (editingUid) await update(record);
    else await add(record);
    resetForm();
  }

  const columns: RecordColumn<PestFertilizerRecord>[] = [
    { key: "date", label: "تاریخ", render: (r) => toFa(r.date) },
    { key: "garden", label: "باغ", render: (r) => r.garden },
    { key: "op", label: "عملیات", render: (r) => r.op },
    { key: "material", label: "کود/سم", render: (r) => r.material || "—" },
    { key: "dose", label: "دوز", render: (r) => r.dose || "—" },
    { key: "operator", label: "اپراتور", render: (r) => r.operator || "—" },
  ];

  return (
    <section className="animate-fade-in-up">
      <ModuleHero icon={meta.icon} title={meta.title} subtitle={meta.subtitle} from={meta.from} to={meta.to} />
      <GlassCard className="mb-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FieldWrap label="تاریخ">
              <JalaliDatePicker
                value={form.date}
                onChange={(v) => setForm({ ...form, date: v })}
                isDayDisabled={(d) => !isDateEditable(d)}
              />
            </FieldWrap>
            <FieldWrap label="باغ / محدوده">
              <Select value={form.garden} onChange={(e) => setForm({ ...form, garden: e.target.value })}>
                {SPRAY_GARDENS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap label="نوع عملیات">
              <Select value={form.op} onChange={(e) => setForm({ ...form, op: e.target.value })}>
                {SPRAY_OPS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap label="نام کود / سم">
              <TextInput value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="مثلاً کود اوره، آبامکتین" />
            </FieldWrap>
            <FieldWrap label="مقدار / دوز مصرف">
              <TextInput value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="مثلاً ۲ لیتر در ۱۰۰۰ لیتر آب" />
            </FieldWrap>
            <FieldWrap label="آفت / هدف">
              <TextInput value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="مثلاً کنه تارتن، تقویت" />
            </FieldWrap>
            <FieldWrap label="اپراتور / سم‌پاش‌زن">
              <TextInput list="workers-list" value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} placeholder="نام اپراتور" />
            </FieldWrap>
            <FieldWrap label="توضیحات" className="sm:col-span-2">
              <TextInput value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="توضیحات اختیاری" />
            </FieldWrap>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" size="lg">
              {editingUid ? "💾 بروزرسانی رکورد" : "➕ ثبت عملیات"}
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
            emptyText="هنوز عملیاتی ثبت نشده است."
            onEdit={startEdit}
            onDelete={(uid) => remove(uid)}
            isRowLocked={(r) => !isDateEditable(r.date)}
          />
        </div>
      </GlassCard>
    </section>
  );
}
