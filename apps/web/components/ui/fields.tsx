"use client";

import { clsx } from "clsx";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export const FIELD_CLASS =
  "w-full rounded-xl border border-sand-300 bg-white/80 px-4 py-3 text-fluid-base outline-none transition-shadow focus:ring-2 focus:ring-leaf-500 focus:border-leaf-500 placeholder:text-bark-500/50";

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-fluid-sm font-bold text-bark-700">{children}</label>;
}

export function FieldWrap({ label, className, children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      {children}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(FIELD_CLASS, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(FIELD_CLASS, "cursor-pointer", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(FIELD_CLASS, "resize-none", props.className)} />;
}

export function Toggle({
  checked,
  onChange,
  label,
  activeLabel = "تأیید شده",
  inactiveLabel = "تأیید نشده",
  alertWhenOff = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  activeLabel?: string;
  inactiveLabel?: string;
  /** Use red (rather than neutral gray) for the "off" state — reserve this
   * for things that genuinely need attention while off (e.g. an unconfirmed
   * quality check), not for an ordinary/expected disabled state. */
  alertWhenOff?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-sand-300 bg-white/70 px-4 py-3">
      {label && <span className="text-fluid-sm font-bold text-bark-700">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative h-8 w-16 shrink-0 rounded-full transition-colors",
          checked ? "bg-leaf-600" : alertWhenOff ? "bg-red-400" : "bg-sand-300",
        )}
      >
        <span
          className={clsx(
            "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all",
            checked ? "right-9" : "right-1",
          )}
        />
      </button>
      <span
        className={clsx(
          "text-fluid-sm font-semibold",
          checked ? "text-leaf-600" : alertWhenOff ? "text-red-500" : "text-bark-500",
        )}
      >
        {checked ? activeLabel : inactiveLabel}
      </span>
    </div>
  );
}

export function RadioGroup<T extends string>({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-sand-300 bg-white/70 px-4 py-3">
      {options.map((opt) => (
        <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-fluid-sm font-medium">
          <input
            type="radio"
            name={name}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-5 w-5 accent-leaf-600"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
