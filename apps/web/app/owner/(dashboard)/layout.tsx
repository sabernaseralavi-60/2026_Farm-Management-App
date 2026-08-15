import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnerSession } from "@/lib/session";
import { LogoutButton } from "./logout-button";

const NAV = [
  { href: "/owner", label: "📊 داشبورد", adminOnly: false },
  { href: "/owner/team", label: "👷 عملکرد کارگران", adminOnly: true },
  { href: "/owner/ask", label: "🤖 پرسش هوشمند", adminOnly: true },
];

export default async function OwnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getOwnerSession();
  if (!session) redirect("/owner/login");
  const isAdmin = session.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-bark-800 via-bark-700 to-leaf-700">
      <header className="glass-strong sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <div>
          <h1 className="text-fluid-lg font-extrabold text-bark-800">
            {isAdmin ? "پنل ادمین مدیریت" : "داشبورد مالک مزرعه"}
          </h1>
          <p className="text-fluid-xs text-bark-500">
            {session.email}
            {isAdmin && <span className="mr-2 rounded-md bg-leaf-500/15 px-1.5 py-0.5 font-bold text-leaf-700">ادمین</span>}
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-1 rounded-xl bg-white/50 p-1">
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-fluid-xs font-bold text-bark-700 transition-colors hover:bg-white hover:text-leaf-700"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
    </div>
  );
}
