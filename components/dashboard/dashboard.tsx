import Hero from "./hero";
import Stats from "./stats";
import TopicsProgress from "./topics-progress";
import WeeklyChart from "./weekly-chart";
import TodayPlan from "./today-plan";
import ReadinessRing from "./readiness-ring";
import AIInsights from "./ai-insights";
import RecentActivity from "./recent-activity";

export default function Dashboard() {
  return (
    <div className="space-y-6">

      <Hero />

      <Stats />

      {/* پیشرفت مباحث + تحلیل هوش مصنوعی */}
      <div className="grid lg:grid-cols-2 gap-6">

        <TopicsProgress />

        <AIInsights />

      </div>

      {/* نمودار + آمادگی */}
      <div className="grid lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2">
          <WeeklyChart />
        </div>

        <ReadinessRing />

      </div>

      {/* برنامه امروز + فعالیت‌ها */}
      <div className="grid lg:grid-cols-2 gap-6">

        <TodayPlan />

        <RecentActivity />

      </div>

    </div>
  );
}