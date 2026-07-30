import { dashboardData } from "@/lib/data/dashboard";

export default function Hero() {
  const { readiness: exam } = dashboardData;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="space-y-4">

        <div>
          <h1 className="text-3xl font-bold">
            CivilMind AI
          </h1>

          <p className="text-muted-foreground mt-2">
            {exam.examTitle}
          </p>
        </div>


        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              روز باقی‌مانده
            </p>

            <p className="text-3xl font-bold">
              {exam.daysLeft}
            </p>
          </div>


          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              درصد آمادگی
            </p>

            <p className="text-3xl font-bold">
              {exam.percentage}%
            </p>
          </div>


          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              رتبه پیش‌بینی
            </p>

            <p className="text-3xl font-bold">
              {exam.predictedBand}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
