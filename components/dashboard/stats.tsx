import StatCard from "./stat-card";
import { dashboardData } from "@/lib/data/dashboard";

export default function Stats() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {dashboardData.metrics.map((item) => (
        <StatCard
          key={item.id}
          title={item.label}
          value={item.value}
        />
      ))}
    </div>
  );
}
