import { findModuleMeta } from "./module-meta";
import { toFa } from "./jalaali";
import { renderIrrigatedZoneMaps } from "./irrigation-map-image";
import type { ModuleKey } from "./types";

/** Notifies Saber on Bale whenever any worker-app login submits data — so
 * he doesn't have to keep opening the site to check whether anything came
 * in. Uses Bale's bot API, which is close to Telegram's:
 * https://tapi.bale.ai/bot<TOKEN>/sendMessage.
 *
 * Both env vars are optional — with either unset this silently no-ops
 * (logged once), the same pattern as OPENROUTER_API_KEY elsewhere in this
 * app, so the feature is safe to ship before Saber has created the bot. */

const SYNC_KEY_TO_PAGE_KEY: Partial<Record<ModuleKey, string>> = { pest_fertilizer: "spray" };

// Every field worth reporting per module, in the same order the form shows
// them — this is meant to read like the actual record, not a teaser (see
// /owner/data for browsing after the fact, this is instead of it).
const FIELDS: Record<ModuleKey, string[]> = {
  attendance: [], // attendance has its own nested formatter below — see formatAttendance
  machinery: ["date", "machine", "driver", "start", "end", "usefulHours", "category", "details", "cost"],
  irrigation: ["date", "worker", "count"], // `gardens` is handled separately (array of numbers)
  pest_fertilizer: ["date", "garden", "op", "material", "dose", "target", "operator", "note"],
  orchard: ["date", "garden", "task", "worker", "count", "status", "note"],
  inventory: ["date", "item", "type", "qty", "unit", "party", "desc"],
  accounting: ["date", "type", "category", "amount", "party", "desc"],
  harvest: ["date", "product", "harvested", "sold", "price", "buyer", "note"],
  sheep: ["date", "category", "count", "amount", "person", "desc"],
  security: ["date", "type", "title", "desc", "identified", "action", "reporter"],
};

const FIELD_LABELS: Record<string, string> = {
  date: "تاریخ",
  worker: "کارگر",
  status: "وضعیت",
  leaveType: "نوع مرخصی",
  machine: "ماشین",
  driver: "راننده",
  start: "ساعت‌کار شروع",
  end: "ساعت‌کار پایان",
  usefulHours: "ساعات کارکرد",
  category: "رویداد",
  details: "جزئیات",
  cost: "هزینه/مصرف",
  count: "تعداد",
  garden: "باغ",
  op: "عملیات",
  material: "کود/سم",
  dose: "دوز",
  target: "هدف",
  operator: "اپراتور",
  note: "توضیحات",
  task: "نوع کار",
  item: "کالا",
  type: "نوع",
  qty: "مقدار",
  unit: "واحد",
  party: "طرف",
  desc: "توضیحات",
  amount: "مبلغ",
  product: "محصول",
  harvested: "برداشت",
  sold: "فروش",
  price: "قیمت واحد",
  buyer: "خریدار",
  person: "مسئول",
  title: "عنوان",
  identified: "شناسایی افراد",
  action: "اقدام انجام‌شده",
  reporter: "گزارش‌دهنده",
};

const faVal = (v: unknown) => toFa(String(v));

function formatShift(label: string, shift: unknown): string | null {
  if (!shift || typeof shift !== "object") return null;
  const s = shift as { in?: string; out?: string; workType?: string; quality?: boolean; bonus?: number | ""; desc?: string };
  const parts = [
    s.in && s.out ? `${faVal(s.in)} تا ${faVal(s.out)}` : null,
    s.workType === "lump" ? "مقطوع" : "پایه",
    `کیفیت: ${s.quality ? "✓" : "—"}`,
    s.bonus ? `پاداش: ${faVal(s.bonus)}` : null,
    s.desc ? `(${s.desc})` : null,
  ].filter(Boolean);
  return `${label}: ${parts.join("، ")}`;
}

function formatAttendance(data: Record<string, unknown>): string[] {
  const lines: string[] = [];
  lines.push(`کارگر: ${data.worker}`);
  lines.push(`تاریخ: ${data.date}`);
  if (data.status === "leave") {
    lines.push(`وضعیت: مرخصی${data.leaveType ? ` (${data.leaveType === "paid" ? "با حقوق" : "بدون حقوق"})` : ""}`);
  } else {
    lines.push("وضعیت: حاضر");
  }
  const morning = formatShift("صبح", data.morning);
  if (morning) lines.push(morning);
  const evening = formatShift("عصر", data.evening);
  if (evening) lines.push(evening);
  return lines;
}

function summarizeRecord(module: ModuleKey, data: Record<string, unknown>): string {
  if (module === "attendance") return formatAttendance(data).join("\n");

  const lines = FIELDS[module]
    .map((f) => {
      const v = data[f];
      if (v === null || v === undefined || v === "") return null;
      const label = FIELD_LABELS[f] ?? f;
      const formatted = typeof v === "number" ? faVal(v) : String(v);
      return `${label}: ${formatted}`;
    })
    .filter((l): l is string => l !== null);

  if (module === "irrigation" && Array.isArray(data.gardens) && data.gardens.length) {
    lines.push(`باغ‌های آبیاری‌شده: ${toFa((data.gardens as number[]).slice().sort((a, b) => a - b).join("، "))}`);
  }

  const photos = data.photos;
  if (Array.isArray(photos) && photos.length) lines.push(`📷 عکس: ${photos.length}`);

  return lines.join("\n");
}

let warnedMissingConfig = false;

async function sendBaleMessage(text: string): Promise<void> {
  const token = process.env.BALE_BOT_TOKEN;
  const chatId = process.env.BALE_CHAT_ID;
  if (!token || !chatId) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn("BALE_BOT_TOKEN/BALE_CHAT_ID not set — skipping data-entry notifications.");
    }
    return;
  }
  try {
    const res = await fetch(`https://tapi.bale.ai/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) console.error("Bale notification failed", res.status, await res.text().catch(() => ""));
  } catch (err) {
    console.error("Bale notification failed", err);
  }
}

async function sendBalePhoto(buffer: Buffer, caption: string): Promise<void> {
  const token = process.env.BALE_BOT_TOKEN;
  const chatId = process.env.BALE_CHAT_ID;
  if (!token || !chatId) return; // sendBaleMessage already logs the missing-config warning
  try {
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("caption", caption);
    form.append("photo", new Blob([new Uint8Array(buffer)], { type: "image/png" }), "map.png");
    const res = await fetch(`https://tapi.bale.ai/bot${token}/sendPhoto`, { method: "POST", body: form });
    if (!res.ok) console.error("Bale photo notification failed", res.status, await res.text().catch(() => ""));
  } catch (err) {
    console.error("Bale photo notification failed", err);
  }
}

/** Fire-and-forget — the caller should schedule this (see
 * lib/sync.ts's use of next/server's `after()`) so a Bale outage never
 * slows down or fails the worker's actual data-entry request. */
export async function notifyDataEntry(opts: {
  action: "ثبت/ویرایش" | "حذف";
  module: ModuleKey;
  displayName: string;
  data: Record<string, unknown>;
  baseUrl: string;
}) {
  const pageKey = SYNC_KEY_TO_PAGE_KEY[opts.module] ?? opts.module;
  const meta = findModuleMeta(pageKey);
  const summary = summarizeRecord(opts.module, opts.data);
  const lines = [
    `📝 ${opts.action} — ${opts.displayName}`,
    `${meta?.icon ?? ""} ${meta?.navLabel ?? opts.module}`.trim(),
    summary,
    `${opts.baseUrl}/owner/data?table=${pageKey}`,
  ].filter(Boolean);
  await sendBaleMessage(lines.join("\n"));

  // Irrigation gets a visual on top of the text: the same garden-map image
  // the worker picked from, with a pin over every irrigated garden — much
  // faster to read than a list of numbers.
  if (opts.module === "irrigation" && Array.isArray(opts.data.gardens) && opts.data.gardens.length) {
    try {
      const maps = await renderIrrigatedZoneMaps(opts.data.gardens as number[], opts.baseUrl);
      for (const m of maps) {
        await sendBalePhoto(m.buffer, `${m.title} — باغ‌های آبیاری‌شده: ${toFa(m.gardenNumbers.join("، "))}`);
      }
    } catch (err) {
      console.error("Bale irrigation map render failed", err);
    }
  }
}
