"use client";

import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { subscribeToasts, type ToastMessage } from "@/lib/toast";

const AUTO_DISMISS_MS = 4500;

const KIND_ICON: Record<ToastMessage["kind"], string> = {
  error: "⚠️",
  success: "✅",
  info: "ℹ️",
};

const KIND_CLASS: Record<ToastMessage["kind"], string> = {
  error: "border-red-300/70 text-red-700",
  success: "border-leaf-300/70 text-leaf-700",
  info: "border-water-300/70 text-bark-700",
};

/** Mounted once in the root layout. Purely presentational — see lib/toast.ts
 * for the imperative `toast.error/success/info(...)` API it listens to. */
export function Toaster() {
  const [items, setItems] = useState<ToastMessage[]>([]);

  useEffect(
    () =>
      subscribeToasts((msg) => {
        setItems((prev) => [...prev, msg]);
        setTimeout(() => {
          setItems((prev) => prev.filter((m) => m.id !== msg.id));
        }, AUTO_DISMISS_MS);
      }),
    [],
  );

  if (!items.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[300] flex flex-col items-center gap-2 px-3 sm:top-4">
      {items.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setItems((prev) => prev.filter((x) => x.id !== m.id))}
          className={clsx(
            "glass-strong pointer-events-auto w-full max-w-sm rounded-2xl border px-4 py-3 text-right text-fluid-sm font-bold shadow-lg animate-fade-in-up",
            KIND_CLASS[m.kind],
          )}
        >
          <span aria-hidden className="ml-1.5">
            {KIND_ICON[m.kind]}
          </span>
          {m.text}
        </button>
      ))}
    </div>
  );
}
