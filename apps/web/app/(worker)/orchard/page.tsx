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
import { GARDENS, ORCHARD_STATUSES, ORCHARD_TASKS, genUid } from "@/lib/reference-data";
import { useModuleStore } from "@/lib/store";
import type { OrchardRecord } from "@/lib/types";

const meta = findModuleMeta("orchard")!;

function emptyForm(): OrchardRecord {
  return {
    uid: "",
    synced: false,
    date: todayJStr(),
    garden: GARDENS[0],
    task: ORCHARD_TASKS[0],
    worker: "",
    count: "",
    status: "انجام شد",
    note: "",
  };
}

export default function OrchardPage() {
  const { rows, loaded, load, add, update, remove } = useModuleStore<OrchardRecord>("orchard")();
  const [form, setForm] = useState<OrchardRecord>(emptyForm());
  const [editingUid, setEditingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  function resetForm() {
    setForm(emptyForm());
    setEditingUid(null);
  }
  function startEdit(row: OrchardRecord) {
    setForm(row);
    setEditingUid(row.uid);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return alert("لطفاً تاریخ را وارد کنید.");
    if (!isDateEditable(form.date)) return alert(`فقط می‌توانید برای امروز یا ${EDITABLE_DAYS_BACK} روز اخیر ثبت/ویرایش کنید.`);
    const record: OrchardRecord = { ...form, uid: editingUid ?? genUid(), synced: false };
    if (editingUid) await update(record);
    else await add(record);
    resetForm();
  }

  const columns: RecordColumn<OrchardRecord>[] = [
    { key: "date", label: "تاریخ", render: (r) => toFa(r.date) },
    { key: "garden", label: "باغ", render: (r) => r.garden },
    { key: "task", label: "نوع کار", render: (r) => r.task },
    { key: "worker", label: "کارگر", render: (r) => r.worker || "—" },
    { key: "count", label: "تعداد", render: (r) => (r.count === "" ? "—" : toFa(r.count)) },
    {
      key: "status",
      label: "وضعیت",
      render: (r) => (
        <span
          className={
            r.status === "انجام شد" ? "font-semibold text-leaf-700" : r.status === "در حال انجام" ? "font-semibold text-gold-700" : "font-semibold text-water-700"
          }
        >
          {r.status}
        </span>
      ),
    },
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
            <FieldWrap label="باغ">
              <Select value={form.garden} onChange={(e) => setForm({ ...form, garden: e.target.value })}>
                {GARDENS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap label="نوع کار">
              <Select value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })}>
                {ORCHARD_TASKS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap label="کارگر / مسئول">
              <TextInput list="workers-list" value={form.worker} onChange={(e) => setForm({ ...form, worker: e.target.value })} placeholder="نام کارگر" />
            </FieldWrap>
            <FieldWrap label="تعداد نخل / مقدار">
              <TextInput type="number" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="اختیاری" />
            </FieldWrap>
            <FieldWrap label="وضعیت">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as OrchardRecord["status"] })}>
                {ORCHARD_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap label="توضیحات" className="sm:col-span-3">
              <TextInput value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="توضیحات اختیاری" />
            </FieldWrap>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" size="lg">
              {editingUid ? "💾 بروزرسانی رکورد" : "➕ ثبت کار باغی"}
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
            emptyText="هنوز کاری ثبت نشده است."
            onEdit={startEdit}
            onDelete={(uid) => remove(uid)}
            isRowLocked={(r) => !isDateEditable(r.date)}
          />
        </div>
      </GlassCard>
    </section>
  );
}
