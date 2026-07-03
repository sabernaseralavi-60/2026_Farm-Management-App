"use client";

import Image from "next/image";
import { Modal } from "@/components/ui/modal";

const SPECIALTIES = [
  "توسعه Full-Stack مدرن (Next.js / React / TypeScript)",
  "علم داده و یادگیری ماشین (Python، R، TensorFlow، PyTorch)",
  "مدل‌سازی آماری و بهینه‌سازی فراابتکاری",
  "بیش از ۸۰ مقاله علمی در نشریات و کنفرانس‌های معتبر بین‌المللی",
];

export function DesignerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="designer-modal-title">
      <button
        type="button"
        onClick={onClose}
        aria-label="بستن"
        className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-sand-100 text-bark-600 hover:bg-sand-200"
      >
        ✕
      </button>

      <div className="flex flex-col items-center text-center">
        <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg">
          <Image
            src="/designer/saber-naseralavi.jpg"
            alt="سید صابر ناصرعلوی"
            fill
            sizes="112px"
            className="object-cover"
            priority
          />
        </div>
        <h2 id="designer-modal-title" className="mt-4 text-fluid-lg font-extrabold text-bark-800">
          سید صابر ناصرعلوی
        </h2>
        <p className="mt-1 text-fluid-sm font-semibold text-leaf-700">
          دکتری مهندسی عمران (برنامه‌ریزی حمل‌ونقل) · عضو هیئت‌علمی دانشگاه شهید باهنر کرمان
        </p>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-fluid-sm font-bold text-bark-700">تخصص‌ها</h3>
        <ul className="space-y-2">
          {SPECIALTIES.map((s) => (
            <li key={s} className="flex items-start gap-2 text-fluid-sm text-bark-700">
              <span className="mt-1 text-leaf-600" aria-hidden>
                ●
              </span>
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href="tel:+989133400718"
          className="flex items-center justify-center gap-2 rounded-2xl bg-sand-100 px-4 py-3 font-semibold text-bark-700 hover:bg-sand-200"
          dir="ltr"
        >
          📞 +98 913 340 0718
        </a>
        <a
          href="mailto:saber.naseralavi@gmail.com"
          className="flex items-center justify-center gap-2 rounded-2xl bg-sand-100 px-4 py-3 font-semibold text-bark-700 hover:bg-sand-200"
          dir="ltr"
        >
          ✉️ saber.naseralavi@gmail.com
        </a>
      </div>

      <a
        href="/designer/CV_Saber.pdf"
        download
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-leaf-600 px-5 py-3.5 font-bold text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:bg-leaf-700"
      >
        ⬇️ دانلود رزومه کامل (PDF)
      </a>
    </Modal>
  );
}
