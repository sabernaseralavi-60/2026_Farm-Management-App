"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EditableRecordTable, type RecordColumn } from "@/components/ui/editable-record-table";
import { FieldWrap, Select, TextInput } from "@/components/ui/fields";
import { GlassCard } from "@/components/ui/glass-card";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { ModuleHero } from "@/components/ui/module-hero";
import { numFa, toFa, todayJStr } from "@/lib/jalaali";
import { findModuleMeta } from "@/lib/module-meta";
import { INVENTORY_UNITS, genUid } from "@/lib/reference-data";
import { useModuleStore } from "@/lib/store";
import type { InventoryRecord, InventoryType } from "@/lib/types";

const meta = findModuleMeta("inventory")!;

function emptyForm(): InventoryRecord {
  return {
    uid: "",
    synced: false,
    date: todayJStr(),
    item: "",
    type: "ورود",
    qty: "",
    unit: INVENTORY_UNITS[0],
    party: "",
    desc: "",
  };
}

export default function InventoryPage() {
  const { rows, loaded, load, add, update, remove } = useModuleStore<InventoryRecord>("inventory")();
  const [form, setForm] = useState<InventoryRecord>(emptyForm());
  const [editingUid, setEditingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  function resetForm() {
    setForm(emptyForm());
    setEditingUid(null);
  }
  function startEdit(row: InventoryRecord) {
    setForm(row);
    setEditingUid(row.uid);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return alert("لطفاً تاریخ را وارد کنید.");
    if (!form.item.trim()) return alert("نام کالا را وارد کنید.");
    const record: InventoryRecord = { ...form, uid: editingUid ?? genUid(), synced: false, item: form.item.trim() };
    if (editingUid) await update(record);
    else await add(record);
    resetForm();
  }

  const balances = useMemo(() => {
    const map = new Map<string, { qty: number; unit: string }>();
    for (const r of rows) {
      const qty = Number(r.qty) || 0;
      const sign = r.type === "ورود" ? 1 : -1;
      const cur = map.get(r.item) ?? { qty: 0, unit: r.unit };
      cur.qty += sign * qty;
      cur.unit = r.unit;
      map.set(r.item, cur);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "fa"));
  }, [rows]);

  const columns: RecordColumn<InventoryRecord>[] = [
    { key: "date", label: "تاریخ", render: (r) => toFa(r.date) },
    { key: "item", label: "کالا", render: (r) => <span className="font-semibold">{r.item}</span> },
    {
      key: "type",
      label: "نوع",
      render: (r) => (
        <span className={r.type === "ورود" ? "font-semibold text-leaf-700" : "font-semibold text-red-600"}>
          {r.type === "ورود" ? "📥 ورود" : "📤 خروج"}
        </span>
      ),
    },
    { key: "qty", label: "مقدار", render: (r) => (r.qty === "" ? "—" : toFa(r.qty)) },
    { key: "unit", label: "واحد", render: (r) => r.unit },
    { key: "party", label: "طرف", render: (r) => r.party || "—" },
  ];

  return (
    <section className="animate-fade-in-up">
      <ModuleHero icon={meta.icon} title={meta.title} subtitle={meta.subtitle} from={meta.from} to={meta.to} />
      <GlassCard className="mb-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FieldWrap label="تاریخ">
              <JalaliDatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            </FieldWrap>
            <FieldWrap label="نام کالا">
              <TextInput value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} placeholder="مثلاً کود اوره، نایلون، بذر" />
            </FieldWrap>
            <FieldWrap label="نوع تراکنش">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as InventoryType })}>
                <option value="ورود">📥 ورود به انبار</option>
                <option value="خروج">📤 خروج از انبار</option>
              </Select>
            </FieldWrap>
            <FieldWrap label="مقدار">
              <TextInput type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value === "" ? "" : Number(e.target.value) })} />
            </FieldWrap>
            <FieldWrap label="واحد">
              <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {INVENTORY_UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap label="تحویل‌دهنده / گیرنده">
              <TextInput value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} placeholder="نام شخص یا تأمین‌کننده" />
            </FieldWrap>
            <FieldWrap label="توضیحات" className="sm:col-span-3">
              <TextInput value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="توضیحات اختیاری" />
            </FieldWrap>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" size="lg">
              {editingUid ? "💾 بروزرسانی رکورد" : "➕ ثبت تراکنش انبار"}
            </Button>
            {editingUid && (
              <Button type="button" variant="soft" size="lg" onClick={resetForm}>
                انصراف از ویرایش
              </Button>
            )}
          </div>
        </form>
      </GlassCard>

      <GlassCard className="mb-6">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-bark-700">🏬 موجودی برآوردی انبار</h3>
        <div className="flex flex-wrap gap-2">
          {balances.length === 0 && <span className="text-fluid-sm text-bark-500">هنوز تراکنشی ثبت نشده است.</span>}
          {balances.map(([item, b]) => (
            <span key={item} className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-fluid-sm font-semibold text-gold-700">
              {item}: {numFa(b.qty)} {b.unit}
            </span>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-5 sm:p-6">
          <EditableRecordTable
            columns={columns}
            rows={[...rows].sort((a, b) => (a.date < b.date ? 1 : -1))}
            emptyText="هنوز تراکنشی ثبت نشده است."
            onEdit={startEdit}
            onDelete={(uid) => remove(uid)}
          />
        </div>
      </GlassCard>
    </section>
  );
}
