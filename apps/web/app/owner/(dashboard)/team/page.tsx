import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import { TeamClient } from "./team-client";

export default async function TeamPage() {
  const session = await requireAdminSession();
  if (!session) redirect("/owner");
  return <TeamClient />;
}
