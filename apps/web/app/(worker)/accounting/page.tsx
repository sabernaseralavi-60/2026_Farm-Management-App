"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EditableRecordTable, type RecordColumn } from "@/components/ui/editable-record-table";
import { FieldWrap, Select, TextInput } from "@/components/ui/fields";
import { GlassCard } from "@/components/ui/glass-card";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { ModuleHero } from "@/components/ui/module-hero";
import { EDITABLE_DAYS_BACK, isDateEditable } from "@/lib/date-policy";
import { money, toFa, todayJStr } from "@/lib/jalaali";
import { findModuleMeta } from "@/lib/module-meta";
import { ACCOUNTING_CATEGORIES, genUid } from "@/lib/reference-data";
import { useModuleStore } from "@/lib/store";
import type { AccountingRecord, AccountingType } from "@/lib/types";

const meta = findModuleMeta("accounting")!;

function emptyForm(): AccountingRecord {
  return {
    uid: "",
    synced: false,
    date: todayJStr(),
    type: "درآمد",
    category: ACCOUNTING_CATEGORIES[0],
    amount: "",
    party: "",
    desc: "",
  };
}

export default function AccountingPage() {
  const { rows, loaded, load, add, update, remove } = useModuleStore<AccountingRecord>("accounting")();
  const [form, setForm] = useState<AccountingRecord>(emptyForm());
  const [editingUid, setEditingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  function resetForm() {
    setForm(emptyForm());
    setEditingUid(null);
  }
  function startEdit(row: AccountingRecord) {
    setForm(row);
    setEditingUid(row.uid);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return alert("لطفاً تاریخ را وارد کنید.");
    if (!isDateEditable(form.date)) return alert(`فقط می‌توانید برای امروز یا ${EDITABLE_DAYS_BACK} روز اخیر ثبت/ویرایش کنید.`);
    const record: AccountingRecord = { ...form, uid: editingUid ?? genUid(), synced: false };
    if (editingUid) await update(record);
    else await add(record);
    resetForm();
  }

  const { income, expense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const r of rows) {
      const amt = Number(r.amount) || 0;
      if (r.type === "درآمد") income += amt;
      else expense += amt;
    }
    return { income, expense };
  }, [rows]);

  const columns: RecordColumn<AccountingRecord>[] = [
    { key: "date", label: "تاریخ", render: (r) => toFa(r.date) },
    {
      key: "type",
      label: "نوع",
      render: (r) => (
        <span className={r.type === "درآمد" ? "font-semibold text-leaf-700" : "font-semibold text-red-600"}>
          {r.type === "درآمد" ? "💵 درآمد" : "🧾 هزینه"}
        </span>
      ),
    },
    { key: "category", label: "دسته", render: (r) => r.category },
    { key: "desc", label: "شرح", render: (r) => r.desc || "—" },
    { key: "party", label: "طرف حساب", render: (r) => r.party || "—" },
    { key: "amount", label: "مبلغ", render: (r) => <span className="font-bold">{money(r.amount)} تومان</span> },
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
            <FieldWrap label="نوع تراکنش">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AccountingType })}>
                <option value="درآمد">💵 درآمد</option>
                <option value="هزینه">🧾 هزینه</option>
              </Select>
            </FieldWrap>
            <FieldWrap label="دسته‌بندی">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {ACCOUNTING_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap label="مبلغ (تومان)">
              <TextInput type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="مبلغ" />
            </FieldWrap>
            <FieldWrap label="طرف حساب">
              <TextInput value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} placeholder="نام شخص/شرکت" />
            </FieldWrap>
            <FieldWrap label="شرح">
              <TextInput value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="شرح تراکنش" />
            </FieldWrap>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" size="lg">
              {editingUid ? "💾 بروزرسانی رکورد" : "➕ ثبت تراکنش مالی"}
            </Button>
            {editingUid && (
              <Button type="button" variant="soft" size="lg" onClick={resetForm}>
                انصراف از ویرایش
              </Button>
            )}
          </div>
        </form>
      </GlassCard>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-leaf-500/30 bg-leaf-500/10 p-5">
          <div className="mb-1 text-fluid-sm font-semibold text-leaf-700">📈 مجموع درآمد</div>
          <div className="text-fluid-xl font-extrabold text-leaf-700">{money(income)} تومان</div>
        </div>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <div className="mb-1 text-fluid-sm font-semibold text-red-600">📉 مجموع هزینه</div>
          <div className="text-fluid-xl font-extrabold text-red-600">{money(expense)} تومان</div>
        </div>
        <div className="rounded-2xl border border-bark-700/30 bg-bark-700/10 p-5">
          <div className="mb-1 text-fluid-sm font-semibold text-bark-700">⚖️ مانده (سود/زیان)</div>
          <div className="text-fluid-xl font-extrabold text-bark-700">{money(income - expense)} تومان</div>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-5 sm:p-6">
          <EditableRecordTable
            columns={columns}
            rows={[...rows].sort((a, b) => (a.date < b.date ? 1 : -1))}
            emptyText="هنوز تراکنشی ثبت نشده است."
            onEdit={startEdit}
            onDelete={(uid) => remove(uid)}
            isRowLocked={(r) => !isDateEditable(r.date)}
          />
        </div>
      </GlassCard>
    </section>
  );
}
