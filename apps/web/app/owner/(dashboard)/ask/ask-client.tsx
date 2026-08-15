"use client";

import { useState } from "react";
import { RangePicker } from "@/components/owner/range-picker";
import { Button } from "@/components/ui/button";
import { FIELD_CLASS } from "@/components/ui/fields";
import { daysAgo } from "@/lib/date-ranges";
import { toFa, todayJStr } from "@/lib/jalaali";

interface QAItem {
  question: string;
  from: string;
  to: string;
  loading: boolean;
  answer?: string;
  error?: string;
}

const EXAMPLES = [
  "کدام کارگر بیشترین نرخ حضور را در این بازه داشته؟",
  "وضعیت مالی این بازه (درآمد، هزینه، مانده) چطور است؟",
  "میانگین باغ‌های آبیاری‌شده در هر روز چند مورد بوده؟",
  "چه حوادث امنیتی‌ای در این بازه ثبت شده؟",
  "کدام کارگر بیشترین پاداش را دریافت کرده؟",
];

export function AskClient() {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(todayJStr());
  const [question, setQuestion] = useState("");
  const [items, setItems] = useState<QAItem[]>([]);
  const [sending, setSending] = useState(false);

  async function ask(raw?: string) {
    const query = (raw ?? question).trim();
    if (!query || sending) return;
    setSending(true);
    setQuestion("");
    const item: QAItem = { question: query, from, to, loading: true };
    setItems((prev) => [...prev, item]);

    try {
      const res = await fetch("/api/owner/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, from, to }),
      });
      const json = await res.json();
      setItems((prev) =>
        prev.map((it) =>
          it === item
            ? { ...it, loading: false, answer: json.ok ? json.answer : undefined, error: json.ok ? undefined : json.error || "خطای نامشخص." }
            : it,
        ),
      );
    } catch {
      setItems((prev) => prev.map((it) => (it === item ? { ...it, loading: false, error: "خطا در ارتباط با سرور." } : it)));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
        <h2 className="font-bold text-bark-700">🤖 پرسش هوشمند از داده‌ها</h2>
        <div className="mr-auto">
          <RangePicker
            from={from}
            to={to}
            onChange={(f, t) => {
              setFrom(f);
              setTo(t);
            }}
          />
        </div>
      </div>

      <div className="glass rounded-2xl p-5 sm:p-6">
        <p className="mb-4 text-fluid-sm text-bark-600">
          سؤال خود را درباره‌ی داده‌های مزرعه در بازه‌ی زمانی بالا بپرسید — دستیار فقط بر اساس آمار واقعی همان بازه پاسخ می‌دهد و چیزی را حدس نمی‌زند.
        </p>

        <div className="mb-5 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => ask(ex)}
              disabled={sending}
              className="rounded-full border border-water-500/30 bg-water-500/10 px-3 py-1.5 text-xs font-semibold text-water-700 transition-colors hover:bg-water-500/20 disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="mb-5 space-y-4">
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-sand-300 bg-sand-50 py-8 text-center text-bark-500">
              هنوز سؤالی پرسیده نشده — یکی از نمونه‌سؤال‌ها را بزنید یا سؤال خودتان را تایپ کنید.
            </div>
          )}
          {items.map((it, i) => (
            <div key={i} className="space-y-2">
              <div className="ml-auto max-w-[85%] rounded-2xl bg-bark-700 px-4 py-3 text-white">
                <p className="text-fluid-sm">{it.question}</p>
                <p className="mt-1 text-[10px] opacity-70">
                  بازه: {toFa(it.from)} تا {toFa(it.to)}
                </p>
              </div>
              <div className="mr-auto max-w-[85%] rounded-2xl border border-water-500/20 bg-water-500/10 px-4 py-3">
                {it.loading ? (
                  <p className="flex items-center gap-2 text-fluid-sm text-bark-500">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-water-500" /> در حال تحلیل داده‌ها...
                  </p>
                ) : it.error ? (
                  <p className="text-fluid-sm font-semibold text-red-600">⚠️ {it.error}</p>
                ) : (
                  <p className="whitespace-pre-wrap text-fluid-sm text-bark-800">{it.answer}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask();
          }}
          className="flex gap-2"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="سؤال خود را بنویسید..."
            disabled={sending}
            className={FIELD_CLASS}
          />
          <Button type="submit" variant="water" disabled={sending || !question.trim()}>
            {sending ? "..." : "📤 پرسیدن"}
          </Button>
        </form>
      </div>
    </div>
  );
}
