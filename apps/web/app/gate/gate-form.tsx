"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldWrap, TextInput } from "@/components/ui/fields";
import { GlassCard } from "@/components/ui/glass-card";

function GateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/gate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(username.trim() ? { username, password: pin } : { pin }),
      });
      if (!res.ok) {
        setError("نام کاربری یا رمز اشتباه است. با مدیر مزرعه چک کنید.");
        return;
      }
      const { home } = (await res.json()) as { home: string };
      // `next` is only honoured for same-site paths; the server-chosen home
      // is where a limited user (e.g. tractor manager) actually has access.
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : home);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "linear-gradient(160deg,#0f2027,#2c2113,#46301d)" }}
    >
      <GlassCard className="glass-strong w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-leaf-600/15 text-3xl">🔒</div>
          <h1 className="text-fluid-lg font-extrabold text-bark-800">سامانه مدیریت مزرعه</h1>
          <p className="mt-1 text-fluid-sm text-bark-500">وارد شوید</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <FieldWrap label="نام کاربری (مخصوص مدیران بخش‌ها)">
            <TextInput
              autoFocus
              dir="ltr"
              autoCapitalize="none"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="خالی بگذارید اگر رمز مزرعه دارید"
              className="text-center"
            />
          </FieldWrap>
          <FieldWrap label={username.trim() ? "رمز عبور" : "رمز مزرعه"}>
            <TextInput
              required
              dir="ltr"
              inputMode="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="رمز را از سرکارگر/مدیر بپرسید"
              className="text-center tracking-widest"
            />
          </FieldWrap>
          {error && <p className="text-fluid-sm font-semibold text-red-600">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "در حال بررسی..." : "ورود به سامانه"}
          </Button>
        </form>
      </GlassCard>
    </main>
  );
}

export function GatePageClient() {
  return (
    <Suspense>
      <GateForm />
    </Suspense>
  );
}
