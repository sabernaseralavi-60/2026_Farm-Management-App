import { MODULE_META } from "./module-meta";
import type { ModuleKey } from "./types";

/** What a worker-app session may touch: "all" (the shared farm PIN) or an
 * explicit list of module keys from MODULE_META (a per-person FieldUser). */
export type GateAccess = "all" | string[];

// MODULE_META's "spray" page is stored under the "pest_fertilizer" sync module.
const SYNC_KEY_TO_PAGE_KEY: Partial<Record<ModuleKey, string>> = { pest_fertilizer: "spray" };

export function canAccessModule(access: GateAccess, pageKey: string): boolean {
  if (access === "all") return true;
  return access.includes(pageKey);
}

export function canSyncModule(access: GateAccess, syncKey: ModuleKey): boolean {
  return canAccessModule(access, SYNC_KEY_TO_PAGE_KEY[syncKey] ?? syncKey);
}

export function canAccessPath(access: GateAccess, pathname: string): boolean {
  const meta = MODULE_META.find((m) => m.href === pathname);
  return meta ? canAccessModule(access, meta.key) : true;
}

/** Where to land a session right after login / at "/". */
export function homePathFor(access: GateAccess): string {
  const first = MODULE_META.find((m) => canAccessModule(access, m.key));
  return first?.href ?? "/gate";
}
