import { redirect } from "next/navigation";
import { getOwnerSession } from "@/lib/session";
import { AskClient } from "./ask-client";

// Available to both the owner and the admin role — the tool only ever reads
// pre-aggregated data (see buildAdminSnapshot) and never executes arbitrary
// queries, so there's no extra risk in the owner reaching it too.
export default async function AskPage() {
  const session = await getOwnerSession();
  if (!session) redirect("/owner/login");
  return <AskClient />;
}
