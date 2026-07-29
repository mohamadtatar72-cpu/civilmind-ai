import StatCard from "./stat-card";
import { dashboardData } from "@/lib/data/dashboard";

export default function Stats() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {dashboardData.stats.map((item) => (
        <StatCard
          key={item.title}
          title={item.title}
          value={`${item.value}${item.unit}`}
        />
      ))}
    </div>
  );
}