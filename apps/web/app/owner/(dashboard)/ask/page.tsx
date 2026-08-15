import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import { AskClient } from "./ask-client";

export default async function AskPage() {
  const session = await requireAdminSession();
  if (!session) redirect("/owner");
  return <AskClient />;
}
