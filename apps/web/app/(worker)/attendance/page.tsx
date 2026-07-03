"use client";

import { useEffect, useState } from "react";
import { EMPTY_SHIFT, ShiftFieldset } from "@/components/attendance/shift-fieldset";
import { Button } from "@/components/ui/button";
import { EditableRecordTable, type RecordColumn } from "@/components/ui/editable-record-table";
import { FieldWrap, RadioGroup, TextInput } from "@/components/ui/fields";
import { GlassCard } from "@/components/ui/glass-card";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { ModuleHero } from "@/components/ui/module-hero";
import { findModuleMeta } from "@/lib/module-meta";
import { genUid } from "@/lib/reference-data";
import { toFa, todayJStr } from "@/lib/jalaali";
import { useModuleStore } from "@/lib/store";
import type { AttendanceRecord, AttendanceStatus, LeaveType, ShiftEntry } from "@/lib/types";

const meta = findModuleMeta("attendance")!;

function emptyForm(): AttendanceRecord {
  return {
    uid: "",
    synced: false,
    date: todayJStr(),
    worker: "",
    status: "present",
  };
}

function shiftSummary(shift?: ShiftEntry) {
  if (!shift) return "—";
  const type = shift.workType === "lump" ? "مقطوع" : "پایه";
  const time = shift.in && shift.out ? `${toFa(shift.in)}–${toFa(shift.out)}` : "—";
  return `${time} · ${type}`;
}

export default function AttendancePage() {
  const { rows, loaded, load, add, update, remove } = useModuleStore<AttendanceRecord>("attendance")();
  const [form, setForm] = useState<AttendanceRecord>(emptyForm());
  const [morningOn, setMorningOn] = useState(false);
  const [eveningOn, setEveningOn] = useState(false);
  const [editingUid, setEditingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  function resetForm() {
    setForm(emptyForm());
    setMorningOn(false);
    setEveningOn(false);
    setEditingUid(null);
  }

  function startEdit(row: AttendanceRecord) {
    setForm(row);
    setMorningOn(!!row.morning);
    setEveningOn(!!row.evening);
    setEditingUid(row.uid);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return alert("لطفاً تاریخ را وارد کنید.");
    if (!form.worker.trim()) return alert("نام کارگر را وارد کنید.");
    if (form.status === "present" && !morningOn && !eveningOn) {
      return alert("حداقل یکی از شیفت‌های صبح یا عصر را فعال کنید، یا وضعیت را «مرخصی» انتخاب کنید.");
    }

    const record: AttendanceRecord = {
      ...form,
      uid: editingUid ?? genUid(),
      synced: editingUid ? false : false,
      worker: form.worker.trim(),
      morning: form.status === "present" && morningOn ? form.morning ?? EMPTY_SHIFT : undefined,
      evening: form.status === "present" && eveningOn ? form.evening ?? EMPTY_SHIFT : undefined,
      leaveType: form.status === "leave" ? form.leaveType ?? "paid" : undefined,
    };

    if (editingUid) {
      await update(record);
    } else {
      await add(record);
    }
    resetForm();
  }

  const columns: RecordColumn<AttendanceRecord>[] = [
    { key: "date", label: "تاریخ", render: (r) => toFa(r.date) },
    { key: "worker", label: "کارگر", render: (r) => <span className="font-semibold">{r.worker}</span> },
    {
      key: "status",
      label: "وضعیت",
      render: (r) =>
        r.status === "leave" ? (
          <span className="font-semibold text-gold-700">
            مرخصی {r.leaveType === "unpaid" ? "(بدون حقوق)" : "(با حقوق)"}
          </span>
        ) : (
          <span className="font-semibold text-leaf-700">حاضر</span>
        ),
    },
    { key: "morning", label: "شیفت صبح", render: (r) => shiftSummary(r.morning) },
    { key: "evening", label: "شیفت عصر", render: (r) => shiftSummary(r.evening) },
    {
      key: "bonus",
      label: "پاداش کل",
      render: (r) => toFa((Number(r.morning?.bonus) || 0) + (Number(r.evening?.bonus) || 0)) + " تومان",
    },
  ];

  return (
    <section className="animate-fade-in-up">
      <ModuleHero icon={meta.icon} title={meta.title} subtitle={meta.subtitle} from={meta.from} to={meta.to} />

      <GlassCard className="mb-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldWrap label="تاریخ">
              <JalaliDatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            </FieldWrap>
            <FieldWrap label="نام کارگر">
              <TextInput
                list="workers-list"
                value={form.worker}
                onChange={(e) => setForm({ ...form, worker: e.target.value })}
                placeholder="انتخاب از لیست یا ورود نام جدید"
              />
            </FieldWrap>
          </div>

          <FieldWrap label="وضعیت">
            <RadioGroup<AttendanceStatus>
              name="attendance-status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={[
                { value: "present", label: "حاضر" },
                { value: "leave", label: "مرخصی" },
              ]}
            />
          </FieldWrap>

          {form.status === "leave" ? (
            <FieldWrap label="نوع مرخصی">
              <RadioGroup<LeaveType>
                name="leave-type"
                value={form.leaveType ?? "paid"}
                onChange={(v) => setForm({ ...form, leaveType: v })}
                options={[
                  { value: "paid", label: "با حقوق" },
                  { value: "unpaid", label: "بدون حقوق" },
                ]}
              />
            </FieldWrap>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ShiftFieldset
                label="شیفت صبح"
                icon="🌅"
                enabled={morningOn}
                onToggleEnabled={setMorningOn}
                value={form.morning ?? EMPTY_SHIFT}
                onChange={(v) => setForm({ ...form, morning: v })}
              />
              <ShiftFieldset
                label="شیفت عصر"
                icon="🌇"
                enabled={eveningOn}
                onToggleEnabled={setEveningOn}
                value={form.evening ?? EMPTY_SHIFT}
                onChange={(v) => setForm({ ...form, evening: v })}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" size="lg">
              {editingUid ? "💾 بروزرسانی رکورد" : "➕ ثبت در لیست"}
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
