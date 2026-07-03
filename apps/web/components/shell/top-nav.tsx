"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { MODULE_META } from "@/lib/module-meta";

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="glass sticky top-0 z-40 hidden border-b border-white/40 md:block">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center">
        {MODULE_META.map((m) => {
          const active = pathname === m.href;
          return (
            <Link
              key={m.key}
              href={m.href}
              className={clsx(
                "flex items-center gap-2 whitespace-nowrap border-b-[3px] px-4 py-3.5 text-fluid-sm font-bold transition-colors",
                active
                  ? "border-leaf-600 text-bark-700"
                  : "border-transparent text-bark-600 hover:bg-white/50",
              )}
            >
              <span aria-hidden>{m.icon}</span> {m.navLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
