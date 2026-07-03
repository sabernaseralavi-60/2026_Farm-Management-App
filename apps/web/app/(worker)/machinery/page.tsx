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
import { MACHINERY_CATEGORIES, MACHINES, genUid } from "@/lib/reference-data";
import { useModuleStore } from "@/lib/store";
import type { MachineryRecord } from "@/lib/types";

const meta = findModuleMeta("machinery")!;

function emptyForm(): MachineryRecord {
  return {
    uid: "",
    synced: false,
    date: todayJStr(),
    machine: MACHINES[0],
    driver: "",
    start: "",
    end: "",
    usefulHours: "",
    category: MACHINERY_CATEGORIES[0],
    details: "",
    cost: "",
  };
}

export default function MachineryPage() {
  const { rows, loaded, load, add, update, remove } = useModuleStore<MachineryRecord>("machinery")();
  const [form, setForm] = useState<MachineryRecord>(emptyForm());
  const [editingUid, setEditingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  function resetForm() {
    setForm(emptyForm());
    setEditingUid(null);
  }

  function startEdit(row: MachineryRecord) {
    setForm(row);
    setEditingUid(row.uid);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return alert("لطفاً تاریخ را وارد کنید.");
    if (!isDateEditable(form.date)) return alert(`فقط می‌توانید برای امروز یا ${EDITABLE_DAYS_BACK} روز اخیر ثبت/ویرایش کنید.`);
    const start = form.start === "" ? "" : Number(form.start);
    const end = form.end === "" ? "" : Number(form.end);
    const usefulHours = start !== "" && end !== "" && end >= start ? +(end - start).toFixed(2) : "";
    const record: MachineryRecord = { ...form, uid: editingUid ?? genUid(), synced: false, start, end, usefulHours };
    if (editingUid) await update(record);
    else await add(record);
    resetForm();
  }

  const columns: RecordColumn<MachineryRecord>[] = [
    { key: "date", label: "تاریخ", render: (r) => toFa(r.date) },
    { key: "machine", label: "ماشین", render: (r) => <span className="font-semibold">{r.machine}</span> },
    { key: "driver", label: "راننده", render: (r) => r.driver || "—" },
    { key: "hours", label: "کارکرد مفید", render: (r) => (r.usefulHours === "" ? "—" : `${toFa(r.usefulHours)} ساعت`) },
    { key: "category", label: "رویداد", render: (r) => r.category },
    { key: "cost", label: "هزینه", render: (r) => r.cost || "—" },
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
            <FieldWrap label="نام ماشین">
              <Select value={form.machine} onChange={(e) => setForm({ ...form, machine: e.target.value })}>
                {MACHINES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap label="نام راننده">
              <TextInput value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} placeholder="نام راننده" />
            </FieldWrap>
            <FieldWrap label="عدد ساعت‌کارِ شروع">
              <TextInput type="number" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value === "" ? "" : Number(e.target.value) })} />
            </FieldWrap>
            <FieldWrap label="عدد ساعت‌کارِ پایان">
              <TextInput type="number" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value === "" ? "" : Number(e.target.value) })} />
            </FieldWrap>
            <FieldWrap label="دسته‌بندی رویداد">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {MACHINERY_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap label="شرح جزئیات" className="sm:col-span-2">
              <TextInput value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="توضیحات رویداد" />
            </FieldWrap>
            <FieldWrap label="هزینه / مصرف">
              <TextInput value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="مثلاً ۴۰ لیتر یا ۲ میلیون تومان" />
            </FieldWrap>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" variant="brown" size="lg">
              {editingUid ? "💾 بروزرسانی رکورد" : "➕ ثبت رویداد ماشین"}
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
            emptyText="هنوز رویدادی ثبت نشده است."
            onEdit={startEdit}
            onDelete={(uid) => remove(uid)}
            isRowLocked={(r) => !isDateEditable(r.date)}
          />
        </div>
      </GlassCard>
    </section>
  );
}
