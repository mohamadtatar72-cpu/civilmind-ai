import AppShell from "@/components/layout/app-shell";
import Dashboard from "@/components/dashboard/dashboard";
import { mockDashboardRepository } from "@/features/dashboard/mock-repository";

export default async function DashboardPage() {
  const dashboard = await mockDashboardRepository.getDashboard();
  return (
    <AppShell>
      <Dashboard data={dashboard} />
    </AppShell>
  );
}
