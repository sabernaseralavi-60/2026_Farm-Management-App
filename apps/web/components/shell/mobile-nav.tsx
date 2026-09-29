"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useState } from "react";
import { canAccessModule, type GateAccess } from "@/lib/access";
import { AdminSsoLink } from "./admin-sso-link";
import { GateLogoutButton } from "./gate-logout-button";
import { OfflineBadge } from "./offline-badge";
import { ThemeToggle } from "./theme-toggle";
import { MODULE_META, findModuleMeta } from "@/lib/module-meta";

export function MobileNav({ access, user, ownerEmail }: { access: GateAccess; user?: string; ownerEmail?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const allowed = MODULE_META.filter((m) => canAccessModule(access, m.key));
  const current = allowed.find((m) => m.href === pathname) ?? allowed[0] ?? findModuleMeta("attendance");

  // Close the drawer on navigation. Adjusting state during render (rather
  // than in a useEffect) avoids an extra commit/paint after each route change.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-sand-200 bg-white/85 px-3 py-2.5 shadow-sm backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="باز کردن منو"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-600 text-lg text-white active:scale-95"
        >
          ☰
        </button>
        <span className="flex min-w-0 items-center gap-2 font-extrabold text-bark-700">
          <span aria-hidden>{current?.icon}</span>
          <span className="truncate">{current?.navLabel}</span>
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <OfflineBadge />
          <GateLogoutButton user={user} className="px-2" />
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[210] md:hidden">
          <div className="absolute inset-0 bg-bark-800/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="glass-strong absolute inset-y-0 right-0 flex w-[84%] max-w-xs flex-col overflow-y-auto animate-fade-in-up">
            <div
              className="flex items-center justify-between px-5 py-4 text-white"
              style={{ background: "linear-gradient(135deg,#059669,#047857)" }}
            >
              <span className="flex items-center gap-2 font-extrabold">🚜 منوی سامانه</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-lg"
                aria-label="بستن منو"
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3">
              {allowed.map((m) => {
                const active = m.href === pathname;
                return (
                  <Link
                    key={m.key}
                    href={m.href}
                    className={clsx(
                      "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-fluid-base font-bold",
                      active ? "bg-leaf-600/15 text-leaf-700" : "text-bark-700 hover:bg-sand-100",
                    )}
                  >
                    <span aria-hidden className="w-6 text-center">
                      {m.icon}
                    </span>
                    {m.navLabel}
                  </Link>
                );
              })}
              <div className="mt-2 flex items-center gap-2 border-t border-sand-200 pt-2">
                {ownerEmail && <AdminSsoLink className="flex-1 justify-center" />}
                <ThemeToggle className="border border-sand-300" />
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
