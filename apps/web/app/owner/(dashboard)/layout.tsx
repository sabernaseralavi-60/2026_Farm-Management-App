import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export default async function OwnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) redirect("/owner/login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-bark-800 via-bark-700 to-leaf-700">
      <header className="glass-strong sticky top-0 z-30 flex items-center justify-between px-5 py-4 sm:px-8">
        <div>
          <h1 className="text-fluid-lg font-extrabold text-bark-800">داشبورد مالک مزرعه</h1>
          <p className="text-fluid-xs text-bark-500">{session.email}</p>
        </div>
        <LogoutButton />
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
    </div>
  );
}
