"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EditableRecordTable, type RecordColumn } from "@/components/ui/editable-record-table";
import { FieldWrap, Select, Textarea, TextInput } from "@/components/ui/fields";
import { GlassCard } from "@/components/ui/glass-card";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { ModuleHero } from "@/components/ui/module-hero";
import { toFa, todayJStr } from "@/lib/jalaali";
import { findModuleMeta } from "@/lib/module-meta";
import { SEC_ACTION, SEC_IDENT, SEC_TYPES, genUid } from "@/lib/reference-data";
import { useModuleStore } from "@/lib/store";
import type { SecurityRecord } from "@/lib/types";

const meta = findModuleMeta("security")!;

function emptyForm(): SecurityRecord {
  return {
    uid: "",
    synced: false,
    date: todayJStr(),
    type: SEC_TYPES[0],
    title: "",
    desc: "",
    identified: SEC_IDENT[0],
    action: SEC_ACTION[0],
    reporter: "",
  };
}

export default function SecurityPage() {
  const { rows, loaded, load, add, update, remove } = useModuleStore<SecurityRecord>("security")();
  const [form, setForm] = useState<SecurityRecord>(emptyForm());
  const [editingUid, setEditingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  function resetForm() {
    setForm(emptyForm());
    setEditingUid(null);
  }
  function startEdit(row: SecurityRecord) {
    setForm(row);
    setEditingUid(row.uid);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return alert("لطفاً تاریخ را وارد کنید.");
    if (!form.title.trim()) return alert("عنوان حادثه را وارد کنید.");
    const record: SecurityRecord = { ...form, uid: editingUid ?? genUid(), synced: false, title: form.title.trim() };
    if (editingUid) await update(record);
    else await add(record);
    resetForm();
  }

  const columns: RecordColumn<SecurityRecord>[] = [
    { key: "date", label: "تاریخ", render: (r) => toFa(r.date) },
    { key: "type", label: "نوع", render: (r) => r.type },
    { key: "title", label: "عنوان", render: (r) => <span className="font-semibold">{r.title}</span> },
    { key: "identified", label: "شناسایی", render: (r) => r.identified || "—" },
    { key: "action", label: "اقدام", render: (r) => r.action || "—" },
    { key: "reporter", label: "گزارش‌دهنده", render: (r) => r.reporter || "—" },
  ];

  return (
    <section className="animate-fade-in-up">
      <ModuleHero icon={meta.icon} title={meta.title} subtitle={meta.subtitle} from={meta.from} to={meta.to} />

      <GlassCard className="mb-6">
        <div className="mb-1 text-fluid-sm font-semibold text-bark-700">⚠️ کل حوادث ثبت‌شده امنیت</div>
        <div className="text-fluid-xl font-extrabold text-bark-700">{toFa(rows.length)}</div>
      </GlassCard>

      <GlassCard className="mb-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FieldWrap label="تاریخ">
              <JalaliDatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            </FieldWrap>
            <FieldWrap label="نوع حادثه">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {SEC_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap label="عنوان">
              <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عنوان مختصر حادثه" />
            </FieldWrap>
            <FieldWrap label="شرح کامل" className="sm:col-span-2 lg:col-span-3">
              <Textarea rows={2} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="شرح جزئیات حادثه..." />
            </FieldWrap>
            <FieldWrap label="شناسایی افراد">
              <Select value={form.identified} onChange={(e) => setForm({ ...form, identified: e.target.value })}>
                {SEC_IDENT.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap label="اقدام انجام‌شده">
              <Select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
                {SEC_ACTION.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap label="گزارش‌دهنده / ناظر">
              <TextInput list="workers-list" value={form.reporter} onChange={(e) => setForm({ ...form, reporter: e.target.value })} placeholder="نام گزارش‌دهنده" />
            </FieldWrap>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" variant="brown" size="lg">
              {editingUid ? "💾 بروزرسانی رکورد" : "➕ ثبت رویداد امنیتی"}
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
