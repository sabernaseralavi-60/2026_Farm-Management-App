"use client";

import { clsx } from "clsx";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

// The DOM attribute (set by ThemeInit / toggled below) is the single source
// of truth — useSyncExternalStore reads it directly instead of mirroring it
// into React state, so there's no synchronous setState-in-effect and no
// server/client hydration mismatch (getServerSnapshot below covers SSR).
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
function getServerSnapshot(): Theme {
  return "light";
}

/** Toggles the app-wide theme set by ThemeInit (see components/system/theme-init.tsx
 * for the no-flash bootstrap and globals.css for the [data-theme="dark"] tokens). */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("farm-theme", next);
    } catch {
      // Private browsing / storage disabled — theme just won't persist across visits.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="تغییر پوسته روشن/تیره"
      className={clsx(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg hover:bg-white/60 active:scale-95",
        className,
      )}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
