"use client";

import { toFa } from "@/lib/jalaali";
import { IRRIGATION_ZONES } from "@/lib/reference-data";
import { Button } from "@/components/ui/button";

/** Step 3: the final cross-zone list the user confirms and submits. */
export function ReviewStep({
  selected,
  locked,
  onRemove,
  onEditZone,
  onBack,
  onSubmit,
}: {
  selected: Set<number>;
  locked: boolean;
  onRemove: (n: number) => void;
  onEditZone: (zone: 1 | 2 | 3 | 4) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const groups = IRRIGATION_ZONES.map((zone) => ({
    zone,
    gardens: zone.gardens.filter((g) => selected.has(g.n)),
  })).filter((g) => g.gardens.length > 0);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-fluid-sm font-bold text-water-700 hover:text-water-600"
      >
        → بازگشت به نقشه راهنما
      </button>

      <h3 className="mb-1 text-fluid-lg font-extrabold text-bark-700">لیست نهایی باغ‌های در حال آبیاری</h3>
      <p className="mb-5 text-fluid-sm text-bark-500">
        پیش از ثبت، لیست را بازبینی کنید — با زدن هر شماره می‌توانید آن را از لیست حذف کنید.
      </p>

      {selected.size === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-sand-50 py-10 text-center text-bark-500">
          هنوز هیچ باغی انتخاب نشده است. از نقشه راهنما یک منطقه را انتخاب کنید.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ zone, gardens }) => (
            <div key={zone.zone} className="rounded-2xl border border-water-500/25 bg-water-500/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-bold text-water-700">
                  {zone.title} — {toFa(gardens.length)} باغ
                </span>
                {!locked && (
                  <button
                    type="button"
                    onClick={() => onEditZone(zone.zone)}
                    className="text-xs font-semibold text-bark-500 hover:text-water-700"
                  >
                    ✏️ ویرایش در نقشه
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {gardens.map((g) => (
                  <button
                    key={g.n}
                    type="button"
                    disabled={locked}
                    onClick={() => onRemove(g.n)}
                    className="group flex items-center gap-1.5 rounded-xl border-2 border-white bg-gradient-to-br from-water-400 to-water-600 px-3 py-2 font-bold text-white shadow disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    💧 باغ {toFa(g.n)}
                    {!locked && <span className="text-white/70 group-hover:text-white">✕</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Button type="button" size="lg" className="mt-6 w-full" onClick={onSubmit} disabled={locked || selected.size === 0}>
        {locked ? "🔒 این روز قفل است" : "💾 تأیید و ثبت آبیاری امروز"}
      </Button>
    </div>
  );
}
