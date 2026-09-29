import { FarmAlertCards } from "@/components/owner/farm-alert-cards";
import { computeFarmAlerts } from "@/lib/farm-alerts";
import { OwnerDashboardClient } from "./dashboard-client";

export default async function OwnerDashboardPage() {
  const alerts = await computeFarmAlerts();
  return (
    <div className="space-y-5">
      <FarmAlertCards alerts={alerts} />
      <OwnerDashboardClient />
    </div>
  );
}
