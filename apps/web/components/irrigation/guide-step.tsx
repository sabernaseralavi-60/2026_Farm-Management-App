"use client";

import { toFa } from "@/lib/jalaali";
import { IRRIGATION_GUIDE_IMAGE, IRRIGATION_GUIDE_ZONES, IRRIGATION_ZONES } from "@/lib/reference-data";
import { Button } from "@/components/ui/button";
import { Hotspot, HotspotMap } from "./hotspot-map";

/** Step 1 of the irrigation wizard: the guide photo with 4 big region
 * hotspots, mirrored below as a plain button grid for accessibility / when
 * the map is hard to tap precisely on a very small screen. */
export function GuideStep({
  selected,
  onPickZone,
  onReview,
}: {
  selected: Set<number>;
  onPickZone: (zone: 1 | 2 | 3 | 4) => void;
  onReview: () => void;
}) {
  const totalSelected = selected.size;

  return (
    <div>
      <p className="mb-4 text-fluid-sm text-bark-600">
        روی هر یک از ۴ منطقه در تصویر راهنما بزنید تا باغ‌های همان منطقه را برای آبیاری امروز مشخص کنید.
      </p>

      <HotspotMap src={IRRIGATION_GUIDE_IMAGE} alt="نقشه راهنمای ۴ منطقه مزرعه" width={910} height={720} priority>
        {IRRIGATION_GUIDE_ZONES.map((gz) => {
          const zoneDef = IRRIGATION_ZONES.find((z) => z.zone === gz.zone)!;
          const picked = zoneDef.gardens.filter((g) => selected.has(g.n)).length;
          return (
            <Hotspot
              key={gz.zone}
              x={gz.x}
              y={gz.y}
              size="clamp(64px, 15%, 132px)"
              onClick={() => onPickZone(gz.zone)}
              title={zoneDef.title}
              className={
                "flex flex-col items-center justify-center border-4 font-black text-white shadow-[0_10px_26px_rgba(2,132,199,.45)] hover:scale-110 active:scale-95 " +
                (picked > 0
                  ? "border-white bg-gradient-to-br from-leaf-500 to-leaf-700 ring-4 ring-leaf-400/40"
                  : "border-white/80 bg-gradient-to-br from-water-500 to-water-700 ring-4 ring-water-400/30 animate-pulse")
              }
            >
              <span className="text-[clamp(1.1rem,4vw,1.9rem)] leading-none">{toFa(gz.zone)}</span>
              <span className="text-[10px] font-bold opacity-90 sm:text-xs">
                {picked > 0 ? `${toFa(picked)}/${toFa(zoneDef.gardens.length)}` : `${toFa(zoneDef.gardens.length)} باغ`}
              </span>
            </Hotspot>
          );
        })}
      </HotspotMap>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {IRRIGATION_ZONES.map((z) => {
          const picked = z.gardens.filter((g) => selected.has(g.n)).length;
          return (
            <button
              key={z.zone}
              type="button"
              onClick={() => onPickZone(z.zone)}
              className="glass flex items-center justify-between rounded-2xl px-4 py-3 text-right transition-transform hover:-translate-y-0.5"
            >
              <span className="font-bold text-bark-700">{z.title}</span>
              <span
                className={
                  "rounded-lg px-2 py-1 text-xs font-bold " +
                  (picked > 0 ? "bg-leaf-500/15 text-leaf-700" : "bg-sand-200 text-bark-500")
                }
              >
                {toFa(picked)}/{toFa(z.gardens.length)}
              </span>
            </button>
          );
        })}
      </div>

      <Button type="button" size="lg" variant="water" className="mt-6 w-full" disabled={totalSelected === 0} onClick={onReview}>
        📋 مشاهده لیست نهایی ({toFa(totalSelected)} باغ انتخاب‌شده)
      </Button>
    </div>
  );
}
