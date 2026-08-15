import { redirect } from "next/navigation";
import { getOwnerSession } from "@/lib/session";
import { TeamClient } from "./team-client";

// Available to both the owner and the admin role — this is read-only
// attendance analytics, not a sensitive admin-only capability.
export default async function TeamPage() {
  const session = await getOwnerSession();
  if (!session) redirect("/owner/login");
  return <TeamClient />;
}
