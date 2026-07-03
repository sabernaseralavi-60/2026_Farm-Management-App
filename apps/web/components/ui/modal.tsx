"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className="absolute inset-0 bg-bark-800/55 backdrop-blur-sm animate-fade-in-up" onClick={onClose} />
      <div className="glass-strong relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 sm:p-8 animate-fade-in-up">
        {children}
      </div>
    </div>
  );
}
