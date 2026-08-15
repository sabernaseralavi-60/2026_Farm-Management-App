import { NextResponse } from "next/server";
import { buildAdminSnapshot } from "@/lib/admin-analytics";
import { askFreeLLM, isLLMConfigured } from "@/lib/llm";
import { requireAdminSession } from "@/lib/session";

const SYSTEM_PROMPT = `تو دستیار تحلیل‌گر داده‌ی «سامانه مدیریت مزرعه حسین‌آباد شهکل» هستی.
یک خلاصه‌ی عددیِ از پیش‌محاسبه‌شده (JSON) از دیتابیس واقعی مزرعه در بازه‌ی زمانی انتخابی در اختیار داری؛ همه‌ی اعداد آن دقیق و واقعی‌اند.
با توجه دقیق به همین داده‌ها، به سؤال کاربر پاسخ بده.
همیشه و فقط به زبان فارسی و با ارقام فارسی پاسخ بده — حتی اگر کلیدها/مقادیر JSON به انگلیسی باشند، ترجمه‌شان کن و هرگز به انگلیسی پاسخ نده.
پاسخ را کوتاه، روشن و کاربردی بنویس.
اگر پاسخ سؤال از داده‌های موجود قابل استخراج نیست، صریح بگو که این داده در بازه‌ی انتخابی موجود نیست — هرگز عدد یا واقعیتی را حدس نزن یا نسازی.
در پاسخ می‌توانی از فهرست یا جدول متنی کوتاه استفاده کنی.`;

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  if (!isLLMConfigured()) {
    return NextResponse.json(
      { ok: false, error: "کلید سرویس LLM تنظیم نشده است. مقدار OPENROUTER_API_KEY را در فایل .env قرار دهید (کلید رایگان از openrouter.ai/keys)." },
      { status: 200 },
    );
  }

  let body: { question?: string; from?: string; to?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const question = body.question?.trim();
  const from = body.from?.trim();
  const to = body.to?.trim();
  if (!question) return NextResponse.json({ ok: false, error: "سؤال خالی است." }, { status: 400 });
  if (!from || !to) return NextResponse.json({ ok: false, error: "بازه‌ی زمانی نامعتبر است." }, { status: 400 });

  const snapshot = await buildAdminSnapshot(from, to);
  const userPrompt = `داده‌های مزرعه در بازه‌ی ${from} تا ${to} (JSON):\n${JSON.stringify(snapshot)}\n\nسؤال ادمین: ${question}`;

  const result = await askFreeLLM(SYSTEM_PROMPT, userPrompt);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 200 });
  }
  return NextResponse.json({ ok: true, answer: result.text, snapshot });
}
