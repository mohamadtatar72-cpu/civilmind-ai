import AppShell from "@/components/layout/app-shell";
import LiveDashboard from "@/components/dashboard/live-dashboard";

export default function DashboardPage() {
  return (
    <AppShell>
      <LiveDashboard />
    </AppShell>
  );
}
