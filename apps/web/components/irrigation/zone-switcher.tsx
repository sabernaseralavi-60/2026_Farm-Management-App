"use client";

import { clsx } from "clsx";
import { toFa } from "@/lib/jalaali";
import { IRRIGATION_ZONES } from "@/lib/reference-data";

/** Compact 4-chip zone jumper (with a per-zone selected-count badge) shown
 * while working inside a zone map, so switching zones doesn't require a
 * round-trip through the guide screen. */
export function ZoneSwitcher({
  active,
  selected,
  onSwitch,
}: {
  active: 1 | 2 | 3 | 4;
  selected: Set<number>;
  onSwitch: (zone: 1 | 2 | 3 | 4) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl bg-sand-100 p-1.5">
      {IRRIGATION_ZONES.map((z) => {
        const picked = z.gardens.filter((g) => selected.has(g.n)).length;
        const isActive = z.zone === active;
        return (
          <button
            key={z.zone}
            type="button"
            onClick={() => onSwitch(z.zone)}
            title={z.title}
            className={clsx(
              "relative flex h-11 w-11 items-center justify-center rounded-xl text-fluid-sm font-black transition-all",
              isActive ? "scale-105 bg-water-600 text-white shadow-md" : "bg-white text-bark-600 hover:bg-water-50",
            )}
          >
            {toFa(z.zone)}
            {picked > 0 && (
              <span
                className={clsx(
                  "absolute -left-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white",
                  isActive ? "bg-leaf-500" : "bg-leaf-600",
                )}
              >
                {toFa(picked)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
