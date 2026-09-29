import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { homePathFor } from "@/lib/access";
import { GATE_COOKIE, getGateSession } from "@/lib/gate";
import { GatePageClient } from "./gate-form";

// The gate cookie already lasts 90 days, so a returning device should never
// have to log in again on its own — but if the browser/PWA happens to
// reopen straight into /gate (a resumed tab, a bookmark, the back button),
// this page used to show the login form regardless. Checking the session
// here first means a device that's already signed in is bounced straight
// back into the app instead of being asked to sign in again.
export default async function GatePage() {
  const cookieStore = await cookies();
  const session = await getGateSession(cookieStore.get(GATE_COOKIE)?.value);
  if (session) redirect(homePathFor(session.access));

  return <GatePageClient />;
}
