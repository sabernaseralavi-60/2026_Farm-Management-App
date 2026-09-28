"use client";

import { useRouter } from "next/navigation";
import { clsx } from "clsx";

/** Ends the worker-app session (shared PIN or per-person login) so someone
 * else can sign in on the same device. Local offline data is left untouched. */
export function GateLogoutButton({ user, className }: { user?: string; className?: string }) {
  const router = useRouter();
  async function onLogout() {
    await fetch("/api/gate/logout", { method: "POST" });
    router.push("/gate");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={onLogout}
      className={clsx(
        "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-fluid-sm font-bold text-bark-600 hover:bg-white/60 active:scale-95",
        className,
      )}
    >
      <span aria-hidden>🚪</span> خروج{user ? <span dir="ltr" className="font-normal text-bark-500">({user})</span> : null}
    </button>
  );
}
