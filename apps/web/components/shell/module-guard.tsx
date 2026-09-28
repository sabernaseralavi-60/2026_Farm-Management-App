"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { canAccessPath, homePathFor, type GateAccess } from "@/lib/access";

/** Keeps a per-person login (e.g. the tractor manager) on its own modules:
 * a direct visit to a module they weren't given bounces to their home page.
 * The data itself is enforced server-side in /api/sync — this is the UX half. */
export function ModuleGuard({ access, children }: { access: GateAccess; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const allowed = canAccessPath(access, pathname);

  useEffect(() => {
    if (!allowed) router.replace(homePathFor(access));
  }, [allowed, access, router]);

  return allowed ? <>{children}</> : null;
}
