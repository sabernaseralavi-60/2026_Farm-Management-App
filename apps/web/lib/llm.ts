/** Free-LLM client for the admin "پرسش هوشمند از داده‌ها" page.
 *
 * Uses OpenRouter (https://openrouter.ai) as a single OpenAI-compatible
 * gateway in front of many providers' free-tier models, so swapping models
 * is just an env var — no code change. Get a free key at
 * https://openrouter.ai/keys (no payment method required for ":free" models). */

const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

export function isLLMConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export interface LLMResult {
  ok: boolean;
  text?: string;
  error?: string;
}

export async function askFreeLLM(system: string, user: string): Promise<LLMResult> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error: "کلید سرویس LLM تنظیم نشده است. مقدار OPENROUTER_API_KEY را در فایل .env قرار دهید (کلید رایگان از openrouter.ai/keys).",
    };
  }
  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://farm-management.local",
        "X-Title": "Farm Management - Admin AI",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch (err) {
    return { ok: false, error: `اتصال به سرویس LLM برقرار نشد: ${err instanceof Error ? err.message : String(err)}` };
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    return { ok: false, error: `سرویس LLM خطا داد (کد ${res.status}): ${bodyText.slice(0, 300) || "بدون جزئیات"}` };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, error: "پاسخ سرویس LLM قابل خواندن نبود." };
  }

  const text = (json as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    return { ok: false, error: "سرویس LLM پاسخ خالی برگرداند — احتمالاً مدل انتخابی موقتاً در دسترس نیست، مدل دیگری را در OPENROUTER_MODEL امتحان کنید." };
  }
  return { ok: true, text: text.trim() };
}
