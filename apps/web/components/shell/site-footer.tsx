"use client";

import { useState } from "react";
import { DesignerModal } from "./designer-modal";

export function SiteFooter() {
  const [open, setOpen] = useState(false);
  return (
    <footer className="mt-10 py-8 text-center text-fluid-xs text-bark-500">
      <p>سامانه مدیریت مزرعه حسین‌آباد شهکل · شهرستان ریگان</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-bark-400 opacity-70 transition hover:bg-sand-200/60 hover:text-bark-600 hover:opacity-100"
      >
        <span aria-hidden>✦</span> طراح
      </button>
      <DesignerModal open={open} onClose={() => setOpen(false)} />
    </footer>
  );
}
