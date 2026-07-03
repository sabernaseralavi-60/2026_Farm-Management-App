"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldWrap, TextInput } from "@/components/ui/fields";
import { GlassCard } from "@/components/ui/glass-card";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError("ایمیل یا رمز عبور اشتباه است.");
        return;
      }
      router.push("/owner");
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
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-leaf-600/15 text-3xl">👤</div>
          <h1 className="text-fluid-lg font-extrabold text-bark-800">داشبورد مالک مزرعه</h1>
          <p className="mt-1 text-fluid-sm text-bark-500">ورود اختصاصی برای مشاهده گزارش‌های مدیریتی</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <FieldWrap label="ایمیل">
            <TextInput type="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FieldWrap>
          <FieldWrap label="رمز عبور">
            <TextInput type="password" required dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} />
          </FieldWrap>
          {error && <p className="text-fluid-sm font-semibold text-red-600">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "در حال ورود..." : "ورود"}
          </Button>
        </form>
      </GlassCard>
    </main>
  );
}
