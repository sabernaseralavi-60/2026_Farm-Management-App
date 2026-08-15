"use client";

import { toFa } from "@/lib/jalaali";
import type { IrrigationZone } from "@/lib/reference-data";
import { Button } from "@/components/ui/button";
import { Hotspot, HotspotMap } from "./hotspot-map";
import { ZoneSwitcher } from "./zone-switcher";

/** Step 2: one zone's garden map — every garden is a toggle button that
 * flips color the instant it's marked as currently irrigating. */
export function ZoneStep({
  zone,
  selected,
  locked,
  onToggle,
  onSelectAll,
  onClearZone,
  onSwitchZone,
  onBackToGuide,
  onReview,
}: {
  zone: IrrigationZone;
  selected: Set<number>;
  locked: boolean;
  onToggle: (n: number) => void;
  onSelectAll: () => void;
  onClearZone: () => void;
  onSwitchZone: (zone: 1 | 2 | 3 | 4) => void;
  onBackToGuide: () => void;
  onReview: () => void;
}) {
  const pickedCount = zone.gardens.filter((g) => selected.has(g.n)).length;
  const hotspotSize = zone.gardens.length > 6 ? "clamp(30px, 6.2%, 52px)" : "clamp(46px, 11%, 84px)";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToGuide}
          className="flex items-center gap-1 text-fluid-sm font-bold text-water-700 hover:text-water-600"
        >
          → بازگشت به نقشه راهنما
        </button>
        <ZoneSwitcher active={zone.zone} selected={selected} onSwitch={onSwitchZone} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-fluid-lg font-extrabold text-bark-700">
          {zone.title} <span className="font-normal text-bark-500">— {toFa(zone.gardens.length)} باغ</span>
        </h3>
        <span className="rounded-lg bg-leaf-500/15 px-3 py-1.5 text-fluid-sm font-bold text-leaf-700">
          💧 {toFa(pickedCount)} از {toFa(zone.gardens.length)} در حال آبیاری
        </span>
      </div>

      {!locked && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="water" onClick={onSelectAll}>
            ✅ انتخاب همه این منطقه
          </Button>
          <Button type="button" size="sm" variant="soft" onClick={onClearZone}>
            🧹 پاک‌کردن این منطقه
          </Button>
        </div>
      )}

      <p className="mb-3 text-fluid-xs text-bark-500 sm:hidden">برای دقت بیشتر، تصویر را با انگشت به چپ/راست بکشید یا زوم کنید.</p>

      <HotspotMap src={zone.image} alt={zone.title} width={zone.width} height={zone.height} minDisplayWidth={zone.minDisplayWidth}>
        {zone.gardens.map((g) => {
          const on = selected.has(g.n);
          return (
            <Hotspot
              key={g.n}
              x={g.x}
              y={g.y}
              size={hotspotSize}
              disabled={locked}
              onClick={() => onToggle(g.n)}
              aria-pressed={on}
              title={`باغ ${g.n}`}
              className={
                "flex items-center justify-center font-black " +
                (locked
                  ? "cursor-not-allowed border-2 border-white/60 bg-bark-800/30 text-white/70"
                  : on
                    ? "z-10 scale-110 border-2 border-white bg-gradient-to-br from-water-400 to-water-600 text-white shadow-[0_0_0_4px_rgba(14,165,233,.25),0_8px_18px_rgba(2,132,199,.5)]"
                    : "border-2 border-white/80 bg-white/55 text-bark-800 shadow-md backdrop-blur-sm hover:scale-110 hover:bg-white/80")
              }
            >
              <span className="text-[clamp(0.65rem,2.4vw,1rem)] leading-none">{toFa(g.n)}</span>
              {on && (
                <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] shadow">
                  💧
                </span>
              )}
            </Hotspot>
          );
        })}
      </HotspotMap>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="soft" size="lg" className="sm:flex-1" onClick={onBackToGuide}>
          🗺 بازگشت به راهنما
        </Button>
        <Button type="button" variant="water" size="lg" className="sm:flex-1" onClick={onReview}>
          📋 لیست نهایی و تأیید
        </Button>
      </div>
    </div>
  );
}
