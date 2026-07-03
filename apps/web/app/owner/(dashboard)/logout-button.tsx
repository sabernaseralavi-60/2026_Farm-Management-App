"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  async function onLogout() {
    await fetch("/api/owner/logout", { method: "POST" });
    router.push("/owner/login");
    router.refresh();
  }
  return (
    <Button variant="soft" size="sm" onClick={onLogout}>
      خروج
    </Button>
  );
}
