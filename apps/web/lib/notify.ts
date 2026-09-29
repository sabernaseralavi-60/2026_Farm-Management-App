import { findModuleMeta } from "./module-meta";
import type { ModuleKey } from "./types";

/** Notifies Saber on Bale whenever a limited worker-app login (Milad,
 * Mousa, ...) submits data — so he doesn't have to keep opening the site to
 * check whether anything came in. Uses Bale's bot API, which is close to
 * Telegram's: https://tapi.bale.ai/bot<TOKEN>/sendMessage.
 *
 * Both env vars are optional — with either unset this silently no-ops
 * (logged once), the same pattern as OPENROUTER_API_KEY elsewhere in this
 * app, so the feature is safe to ship before Saber has created the bot. */

const SYNC_KEY_TO_PAGE_KEY: Partial<Record<ModuleKey, string>> = { pest_fertilizer: "spray" };

// Fields worth showing per module, in order — kept short on purpose (a Bale
// push notification, not a full record dump); see /owner/data for the rest.
const HIGHLIGHT_FIELDS: Record<ModuleKey, string[]> = {
  attendance: ["worker", "date", "status"],
  machinery: ["machine", "date", "category"],
  irrigation: ["date", "count"],
  pest_fertilizer: ["garden", "date", "op"],
  orchard: ["garden", "date", "task"],
  inventory: ["item", "date", "type", "qty"],
  accounting: ["date", "type", "category", "amount"],
  harvest: ["date", "product"],
  sheep: ["date", "category", "count"],
  security: ["date", "title"],
};

const FIELD_LABELS: Record<string, string> = {
  worker: "کارگر",
  date: "تاریخ",
  status: "وضعیت",
  machine: "ماشین",
  category: "رویداد",
  count: "تعداد",
  garden: "باغ",
  op: "عملیات",
  task: "نوع کار",
  item: "کالا",
  type: "نوع",
  qty: "مقدار",
  amount: "مبلغ",
  product: "محصول",
  title: "عنوان",
};

function summarizeRecord(module: ModuleKey, data: Record<string, unknown>): string {
  const fields = HIGHLIGHT_FIELDS[module]
    .map((f) => {
      const v = data[f];
      if (v === null || v === undefined || v === "") return null;
      return `${FIELD_LABELS[f] ?? f}: ${v}`;
    })
    .filter(Boolean);
  const photos = data.photos;
  if (Array.isArray(photos) && photos.length) fields.push(`📷 ${photos.length} عکس`);
  return fields.join(" — ");
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

/** Fire-and-forget — the caller should `void` this so a Bale outage never
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
}
