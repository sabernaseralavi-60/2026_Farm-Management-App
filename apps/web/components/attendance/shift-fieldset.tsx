"use client";

import { FieldWrap, RadioGroup, TextInput, Textarea, Toggle } from "@/components/ui/fields";
import type { ShiftEntry, WorkType } from "@/lib/types";

const EMPTY_SHIFT: ShiftEntry = { in: "", out: "", workType: "base", desc: "", quality: false, bonus: "" };

export { EMPTY_SHIFT };

export function ShiftFieldset({
  label,
  icon,
  enabled,
  onToggleEnabled,
  value,
  onChange,
}: {
  label: string;
  icon: string;
  enabled: boolean;
  onToggleEnabled: (v: boolean) => void;
  value: ShiftEntry;
  onChange: (v: ShiftEntry) => void;
}) {
  return (
    <div className="rounded-2xl border border-sand-300 bg-white/60 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-fluid-base font-extrabold text-bark-700">
          <span aria-hidden>{icon}</span> {label}
        </span>
        <Toggle checked={enabled} onChange={onToggleEnabled} activeLabel="ثبت می‌شود" inactiveLabel="ثبت نمی‌شود" />
      </div>

      {enabled && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrap label="ساعت ورود">
            <TextInput type="time" value={value.in} onChange={(e) => onChange({ ...value, in: e.target.value })} />
          </FieldWrap>
          <FieldWrap label="ساعت خروج">
            <TextInput type="time" value={value.out} onChange={(e) => onChange({ ...value, out: e.target.value })} />
          </FieldWrap>
          <FieldWrap label="نوع کار" className="sm:col-span-2">
            <RadioGroup<WorkType>
              name={`${label}-work-type`}
              value={value.workType}
              onChange={(v) => onChange({ ...value, workType: v })}
              options={[
                { value: "base", label: "فقط پایه" },
                { value: "lump", label: "مقطوع" },
              ]}
            />
          </FieldWrap>
          <FieldWrap label="پاداش این شیفت (تومان)">
            <TextInput
              type="number"
              min={0}
              value={value.bonus}
              onChange={(e) => onChange({ ...value, bonus: e.target.value === "" ? "" : Number(e.target.value) })}
              placeholder="مثلاً ۵۰۰۰۰"
            />
          </FieldWrap>
          <FieldWrap label="تأیید کیفیت توسط مدیر">
            <Toggle checked={value.quality} onChange={(v) => onChange({ ...value, quality: v })} alertWhenOff />
          </FieldWrap>
          <FieldWrap label="شرح کار این شیفت" className="sm:col-span-2">
            <Textarea
              rows={2}
              value={value.desc}
              onChange={(e) => onChange({ ...value, desc: e.target.value })}
              placeholder="توضیحات کار..."
            />
          </FieldWrap>
        </div>
      )}
    </div>
  );
}
