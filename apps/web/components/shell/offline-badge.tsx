"use client";

import { clsx } from "clsx";
import { useEffect, useState, useSyncExternalStore } from "react";
import { onRecordSynced } from "@/lib/sync-bus";
import { syncPendingAll } from "@/lib/sync";
import { pendingSyncCount } from "@/lib/store";
import { toFa } from "@/lib/jalaali";

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}
const getOnlineSnapshot = () => navigator.onLine;
const getServerOnlineSnapshot = () => true;

/** Hidden when everything is fine (online, nothing queued) — only speaks up
 * when there's something the worker should know about: no signal, or
 * records still waiting to reach the server. Clicking it (while online)
 * nudges a retry right away instead of waiting for the next 60s sweep. */
export function OfflineBadge({ className }: { className?: string }) {
  const online = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerOnlineSnapshot);
  const [pending, setPending] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const refresh = () => void pendingSyncCount().then(setPending);
    refresh();
    const unsubSynced = onRecordSynced(refresh);
    const interval = window.setInterval(refresh, 15_000);
    return () => {
      unsubSynced();
      window.clearInterval(interval);
    };
  }, []);

  if (online && pending === 0) return null;

  async function retryNow() {
    if (!online || retrying) return;
    setRetrying(true);
    try {
      await syncPendingAll();
      setPending(await pendingSyncCount());
    } finally {
      setRetrying(false);
    }
  }

  return (
    <button
      type="button"
      onClick={retryNow}
      disabled={!online || retrying}
      className={clsx(
        "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-fluid-xs font-bold",
        online ? "bg-gold-500/15 text-gold-700 hover:bg-gold-500/25" : "bg-red-500/15 text-red-700",
        className,
      )}
      title={online ? "برای تلاش دوباره کلیک کنید" : "بدون اینترنت — داده‌ها روی همین دستگاه ذخیره می‌مانند"}
    >
      <span aria-hidden>{online ? "⏳" : "📡"}</span>
      {online ? `${toFa(pending)} در انتظار ارسال${retrying ? "..." : ""}` : "آفلاین"}
    </button>
  );
}
