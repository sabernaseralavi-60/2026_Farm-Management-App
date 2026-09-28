import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { homePathFor } from "@/lib/access";
import { GATE_COOKIE, getGateSession } from "@/lib/gate";

export default async function RootPage() {
  const cookieStore = await cookies();
  const session = await getGateSession(cookieStore.get(GATE_COOKIE)?.value);
  redirect(session ? homePathFor(session.access) : "/attendance");
}
