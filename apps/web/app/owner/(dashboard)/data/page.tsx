import { redirect } from "next/navigation";
import { getOwnerSession } from "@/lib/session";
import { DataBrowserClient } from "./data-browser-client";

// Read-only browser over the raw records behind every worker-app module
// (see lib/admin-tables.ts for the fixed column/search allowlist). Same
// access as the rest of the dashboard — owner and admin both see it.
export default async function DataBrowserPage() {
  const session = await getOwnerSession();
  if (!session) redirect("/owner/login");
  return <DataBrowserClient />;
}
