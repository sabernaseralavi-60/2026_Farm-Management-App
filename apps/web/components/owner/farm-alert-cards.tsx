import { clsx } from "clsx";
import type { FarmAlert } from "@/lib/farm-alerts";

/** Plain rule-based alerts (see lib/farm-alerts.ts) — no AI, just thresholds
 * over the existing tables, so every alert here can be pointed straight
 * back at the records that triggered it. */
export function FarmAlertCards({ alerts }: { alerts: FarmAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="glass flex items-center gap-2 rounded-2xl p-4 text-fluid-sm font-bold text-leaf-700">
        <span aria-hidden>✅</span> در حال حاضر هشدار قابل‌توجهی نیست.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={clsx(
            "glass flex items-start gap-2.5 rounded-2xl border p-3.5 text-fluid-sm font-semibold",
            a.severity === "critical" ? "border-red-300/70 text-red-700" : "border-gold-500/40 text-gold-700",
          )}
        >
          <span aria-hidden className="text-lg leading-none">
            {a.icon}
          </span>
          <span>{a.text}</span>
        </div>
      ))}
    </div>
  );
}
