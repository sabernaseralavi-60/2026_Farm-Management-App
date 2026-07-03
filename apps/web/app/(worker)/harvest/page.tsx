"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EditableRecordTable, type RecordColumn } from "@/components/ui/editable-record-table";
import { FieldWrap, Select, TextInput } from "@/components/ui/fields";
import { GlassCard } from "@/components/ui/glass-card";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { ModuleHero } from "@/components/ui/module-hero";
import { money, toFa, todayJStr } from "@/lib/jalaali";
import { findModuleMeta } from "@/lib/module-meta";
import { HARVEST_PRODUCTS, genUid } from "@/lib/reference-data";
import { useModuleStore } from "@/lib/store";
import type { HarvestRecord } from "@/lib/types";

const meta = findModuleMeta("harvest")!;

function emptyForm(): HarvestRecord {
  return {
    uid: "",
    synced: false,
    date: todayJStr(),
    product: HARVEST_PRODUCTS[0],
    harvested: "",
    sold: "",
    price: "",
    buyer: "",
    note: "",
  };
}

export default function HarvestPage() {
  const { rows, loaded, load, add, update, remove } = useModuleStore<HarvestRecord>("harvest")();
  const [form, setForm] = useState<HarvestRecord>(emptyForm());
  const [editingUid, setEditingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  function resetForm() {
    setForm(emptyForm());
    setEditingUid(null);
  }
  function startEdit(row: HarvestRecord) {
    setForm(row);
    setEditingUid(row.uid);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return alert("لطفاً تاریخ را وارد کنید.");
    const record: HarvestRecord = { ...form, uid: editingUid ?? genUid(), synced: false };
    if (editingUid) await update(record);
    else await add(record);
    resetForm();
  }

  const totals = useMemo(() => {
    let harvested = 0;
    let sold = 0;
    let revenue = 0;
    for (const r of rows) {
      harvested += Number(r.harvested) || 0;
      sold += Number(r.sold) || 0;
      revenue += (Number(r.sold) || 0) * (Number(r.price) || 0);
    }
    return { harvested, sold, revenue };
  }, [rows]);

  const columns: RecordColumn<HarvestRecord>[] = [
    { key: "date", label: "تاریخ", render: (r) => toFa(r.date) },
    { key: "product", label: "محصول", render: (r) => <span className="font-semibold">{r.product}</span> },
    { key: "harvested", label: "برداشت", render: (r) => (r.harvested === "" ? "—" : toFa(r.harvested)) },
    { key: "sold", label: "فروش", render: (r) => (r.sold === "" ? "—" : toFa(r.sold)) },
    { key: "price", label: "قیمت واحد", render: (r) => (r.price === "" ? "—" : money(r.price)) },
    { key: "total", label: "مبلغ کل", render: (r) => money((Number(r.sold) || 0) * (Number(r.price) || 0)) },
    { key: "buyer", label: "خریدار", render: (r) => r.buyer || "—" },
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
            <FieldWrap label="نوع محصول">
              <Select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
                {HARVEST_PRODUCTS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap label="مقدار برداشت (کیلوگرم)">
              <TextInput type="number" value={form.harvested} onChange={(e) => setForm({ ...form, harvested: e.target.value === "" ? "" : Number(e.target.value) })} />
            </FieldWrap>
            <FieldWrap label="مقدار فروش (کیلوگرم)">
              <TextInput type="number" value={form.sold} onChange={(e) => setForm({ ...form, sold: e.target.value === "" ? "" : Number(e.target.value) })} />
            </FieldWrap>
            <FieldWrap label="قیمت واحد (تومان/کیلو)">
              <TextInput type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value === "" ? "" : Number(e.target.value) })} />
            </FieldWrap>
            <FieldWrap label="خریدار">
              <TextInput value={form.buyer} onChange={(e) => setForm({ ...form, buyer: e.target.value })} placeholder="نام خریدار" />
            </FieldWrap>
            <FieldWrap label="توضیحات" className="sm:col-span-2 lg:col-span-3">
              <TextInput value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="توضیحات اختیاری" />
            </FieldWrap>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" size="lg">
              {editingUid ? "💾 بروزرسانی رکورد" : "➕ ثبت برداشت/فروش"}
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
        <div className="rounded-2xl border border-gold-500/30 bg-gold-500/10 p-5">
          <div className="mb-1 text-fluid-sm font-semibold text-gold-700">🧺 مجموع برداشت</div>
          <div className="text-fluid-xl font-extrabold text-gold-700">{toFa(totals.harvested)} کیلوگرم</div>
        </div>
        <div className="rounded-2xl border border-water-500/30 bg-water-500/10 p-5">
          <div className="mb-1 text-fluid-sm font-semibold text-water-700">🚚 مجموع فروش</div>
          <div className="text-fluid-xl font-extrabold text-water-700">{toFa(totals.sold)} کیلوگرم</div>
        </div>
        <div className="rounded-2xl border border-leaf-500/30 bg-leaf-500/10 p-5">
          <div className="mb-1 text-fluid-sm font-semibold text-leaf-700">💰 درآمد فروش</div>
          <div className="text-fluid-xl font-extrabold text-leaf-700">{money(totals.revenue)} تومان</div>
        </div>
      </div>

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
