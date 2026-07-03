import { MobileNav } from "@/components/shell/mobile-nav";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { TopNav } from "@/components/shell/top-nav";
import { WorkersDatalist } from "@/components/shell/workers-datalist";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
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
