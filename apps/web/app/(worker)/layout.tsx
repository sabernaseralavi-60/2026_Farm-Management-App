import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MobileNav } from "@/components/shell/mobile-nav";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { TopNav } from "@/components/shell/top-nav";
import { WorkersDatalist } from "@/components/shell/workers-datalist";
import { GATE_COOKIE, verifyGateToken } from "@/lib/gate";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const ok = await verifyGateToken(cookieStore.get(GATE_COOKIE)?.value);
  if (!ok) redirect("/gate");

  return (
    <>
      <SiteHeader />
      <TopNav />
      <MobileNav />
      <WorkersDatalist />
      <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
      <SiteFooter />
    </>
  );
}
