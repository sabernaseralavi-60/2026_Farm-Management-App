import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MobileNav } from "@/components/shell/mobile-nav";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { TopNav } from "@/components/shell/top-nav";
import { WorkersDatalist } from "@/components/shell/workers-datalist";
import { ModuleGuard } from "@/components/shell/module-guard";
import { GATE_COOKIE, getGateSession } from "@/lib/gate";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = await getGateSession(cookieStore.get(GATE_COOKIE)?.value);
  if (!session) redirect("/gate");

  return (
    <>
      <SiteHeader />
      <TopNav access={session.access} user={session.user} />
      <MobileNav access={session.access} user={session.user} />
      <WorkersDatalist />
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <ModuleGuard access={session.access}>{children}</ModuleGuard>
      </main>
      <SiteFooter />
    </>
  );
}
