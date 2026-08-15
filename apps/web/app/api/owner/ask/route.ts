import { NextResponse } from "next/server";
import { buildAdminSnapshot } from "@/lib/admin-analytics";
import { askFreeLLM, isLLMConfigured } from "@/lib/llm";
import { getOwnerSession } from "@/lib/session";

const SYSTEM_PROMPT = `تو دستیار تحلیل‌گر داده‌ی «سامانه مدیریت مزرعه حسین‌آباد شهکل» هستی.
یک خلاصه‌ی عددیِ از پیش‌محاسبه‌شده (JSON) از دیتابیس واقعی مزرعه در بازه‌ی زمانی انتخابی در اختیار داری؛ همه‌ی اعداد آن دقیق و واقعی‌اند و از قبل توسط کد (نه توسط تو) محاسبه شده‌اند.

راهنمای بخش‌های مربوط به حضور و غیاب (attendance):
- workerPerformance: خلاصه‌ی هر کارگر (روزهای حضور/مرخصی، نرخ حضور، نرخ تأیید کیفیت شیفت، پاداش).
- attendance.attendanceDetail: به‌ازای هر کارگر، leaveDates (تاریخ دقیق هر روز مرخصی به‌همراه نوع paid/unpaid) و records (رکورد روزانه‌ی خام شامل ساعت ورود/خروج صبح و عصر) — برای سؤالاتی مثل «چه تاریخ‌هایی غایب بود» یا «چند نمونه رکورد نشان بده» از همین‌جا جواب بده. اگر attendance.recordsTruncated=true باشد یعنی بازه بزرگ بوده و records خالی گذاشته شده (فقط leaveDates کامل مانده)؛ این را صریح به کاربر بگو.
- attendance.shiftTiming.byWorker: آمار توصیفی ساعت ورود صبح/عصر هر کارگر — n، mean/median (میانگین/میانه به‌صورت دقیقه از نیمه‌شب و meanHHMM/medianHHMM به‌صورت ساعت:دقیقه)، min/max، range، variance، stdev، q1/q3/iqr. این‌ها را مستقیم به‌عنوان معیارهای تمایل به مرکز (میانگین، میانه) و پراکندگی (دامنه، واریانس، انحراف معیار، IQR) گزارش کن.
- attendance.shiftTiming.pairwiseComparisons: مقایسه‌ی آماری استنباطی (آزمون t دو نمونه‌ای ولش/Welch) — شامل tStat، df، pValue، significantAt05 و بازه‌ی اطمینان ۹۵٪ برای اختلاف میانگین‌ها (ci95Diff). این فهرست از قبل فیلتر شده و فقط شامل جفت‌کارگرهایی است که نام هر دو در سؤال ادمین ذکر شده — دقیقاً همین نتایج آماده را با معنای درست‌شان روایت کن (هرگز خودت عدد آماری تازه محاسبه نکن). اگر این فهرست خالی است یعنی یا سؤال نام دو کارگر مشخص را نداشت یا داده‌ی کافی برای آن جفت نبود؛ در این حالت اگر سؤال کلی بود (نه مقایسه‌ی دو نفر خاص)، برای مقایسه‌ی توصیفی از attendance.shiftTiming.byWorker (میانگین/انحراف‌معیار هرکدام) استفاده کن، وگرنه صریح بگو کدام نام‌ها شناسایی نشدند.

با توجه دقیق به همین داده‌ها، به سؤال کاربر پاسخ بده.
همیشه و فقط به زبان فارسی و با ارقام فارسی پاسخ بده — حتی اگر کلیدها/مقادیر JSON به انگلیسی باشند، ترجمه‌شان کن و هرگز به انگلیسی پاسخ نده.
پاسخ را کوتاه، روشن و کاربردی بنویس؛ برای اعداد آماری از جدول یا فهرست کوتاه استفاده کن.
اگر پاسخ سؤال از داده‌های موجود واقعاً قابل استخراج نیست، صریح بگو که این داده در بازه‌ی انتخابی موجود نیست — هرگز عدد یا واقعیتی را حدس نزن یا نسازی. اما قبل از این جواب، حتماً همه‌ی بخش‌های JSON (به‌خصوص attendance.attendanceDetail و attendance.shiftTiming) را برای وجود داده مرتبط بررسی کن.`;

export async function POST(request: Request) {
  const session = await getOwnerSession();
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

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

  // Free models are unreliable at picking the right entry out of a long list
  // (confirmed in testing: asked to compare two named workers, one model
  // answered about a completely different pair pulled from the full ~50-item
  // pairwiseComparisons array). So we do the matching deterministically here
  // and only forward the pair(s) actually named in the question — the model
  // never has to search.
  const workerNames = snapshot.workerPerformance.map((w) => w.worker);
  const mentionedWorkers = workerNames.filter((w) => question.includes(w));
  const promptSnapshot = {
    ...snapshot,
    attendance: {
      ...snapshot.attendance,
      shiftTiming: {
        ...snapshot.attendance.shiftTiming,
        pairwiseComparisons:
          mentionedWorkers.length >= 2
            ? snapshot.attendance.shiftTiming.pairwiseComparisons.filter(
                (c) => mentionedWorkers.includes(c.workerA) && mentionedWorkers.includes(c.workerB),
              )
            : [],
      },
    },
  };

  const userPrompt = `داده‌های مزرعه در بازه‌ی ${from} تا ${to} (JSON):\n${JSON.stringify(promptSnapshot)}\n\nسؤال ادمین: ${question}`;

  const result = await askFreeLLM(SYSTEM_PROMPT, userPrompt);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 200 });
  }
  return NextResponse.json({ ok: true, answer: result.text, snapshot });
}
