import { clsx } from "clsx";
import type { ReactNode } from "react";

type Tone = "ok" | "no" | "warn" | "info";

const TONE_CLASS: Record<Tone, string> = {
  ok: "text-leaf-700 bg-leaf-500/15",
  no: "text-red-600 bg-red-500/15",
  warn: "text-gold-700 bg-gold-500/15",
  info: "text-water-700 bg-water-500/15",
};

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold", TONE_CLASS[tone])}>
      {children}
    </span>
  );
}

export function SyncBadge({ synced }: { synced: boolean }) {
  return synced ? (
    <Badge tone="ok" >☁️ همگام</Badge>
  ) : (
    <Badge tone="warn">⏳ در انتظار</Badge>
  );
}
