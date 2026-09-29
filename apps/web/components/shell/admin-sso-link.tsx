"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";

/** Shown only for the worker-app login that's linked to an Owner account
 * (see FieldUser.ownerEmail / /api/owner/sso). Jumps into /owner using the
 * already-verified gate session — no second email/password login. */
export function AdminSsoLink({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/owner/sso", { method: "POST" });
      if (!res.ok) return;
      router.push("/owner");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={clsx(
        "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-fluid-sm font-bold text-bark-600 hover:bg-white/60 active:scale-95",
        className,
      )}
    >
      <span aria-hidden>📊</span> پنل مدیریت
    </button>
  );
}
