"use client";

import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";
import { JMONTHS, jMonthLen, jalaaliWeekday, pad2, parseJalaaliStr, toFa, todayJStr } from "@/lib/jalaali";
import { FIELD_CLASS } from "./fields";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function JalaliDatePicker({ value, onChange, placeholder = "انتخاب تاریخ", className }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const parsed = parseJalaaliStr(value) ?? (() => {
    const t = parseJalaaliStr(todayJStr())!;
    return t;
  })();
  const [viewY, setViewY] = useState(parsed.jy);
  const [viewM, setViewM] = useState(parsed.jm);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function openPicker() {
    const p = parseJalaaliStr(value);
    if (p) {
      setViewY(p.jy);
      setViewM(p.jm);
    }
    setOpen(true);
  }

  function navMonth(dir: 1 | -1) {
    let m = viewM + dir;
    let y = viewY;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setViewM(m);
    setViewY(y);
  }

  function pick(d: number) {
    onChange(`${viewY}/${pad2(viewM)}/${pad2(d)}`);
    setOpen(false);
  }

  function pickToday() {
    const t = parseJalaaliStr(todayJStr())!;
    setViewY(t.jy);
    setViewM(t.jm);
    onChange(`${t.jy}/${pad2(t.jm)}/${pad2(t.jd)}`);
    setOpen(false);
  }

  const firstCol = jalaaliWeekday(viewY, viewM, 1);
  const len = jMonthLen(viewY, viewM);
  const selected = parseJalaaliStr(value);
  const days: (number | null)[] = [...Array(firstCol).fill(null), ...Array.from({ length: len }, (_, i) => i + 1)];

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={openPicker}
        className={clsx(FIELD_CLASS, "flex items-center justify-between text-right", className)}
      >
        <span className={value ? "text-bark-800" : "text-bark-500/60"}>{value ? toFa(value) : placeholder}</span>
        <span aria-hidden>📅</span>
      </button>
      {open && (
        <div className="glass-strong absolute z-40 mt-2 w-72 rounded-2xl p-3 animate-fade-in-up">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => navMonth(-1)} className="h-8 w-8 rounded-lg bg-sand-100 text-bark-700 hover:bg-sand-200">
              ‹
            </button>
            <span className="font-bold text-bark-700">
              {JMONTHS[viewM - 1]} {toFa(viewY)}
            </span>
            <button type="button" onClick={() => navMonth(1)} className="h-8 w-8 rounded-lg bg-sand-100 text-bark-700 hover:bg-sand-200">
              ›
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-bark-500">
            {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) =>
              d === null ? (
                <span key={`e${i}`} className="h-9" />
              ) : (
                <button
                  key={d}
                  type="button"
                  onClick={() => pick(d)}
                  className={clsx(
                    "h-9 rounded-lg text-sm transition-colors hover:bg-leaf-100",
                    selected?.jy === viewY && selected?.jm === viewM && selected?.jd === d
                      ? "bg-leaf-600 font-bold text-white hover:bg-leaf-600"
                      : "text-bark-800",
                  )}
                >
                  {toFa(d)}
                </button>
              ),
            )}
          </div>
          <div className="mt-2 text-center">
            <button type="button" onClick={pickToday} className="rounded-lg bg-sand-100 px-4 py-1.5 text-sm font-semibold text-bark-700 hover:bg-sand-200">
              امروز
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
