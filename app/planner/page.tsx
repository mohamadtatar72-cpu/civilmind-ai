import AppShell from "@/components/layout/app-shell";

const tasks = [
  {
    title: "مطالعه مبحث ۹ (بتن)",
    progress: 80,
    status: "در حال انجام",
  },
  {
    title: "حل آزمون شماره ۱۲",
    progress: 40,
    status: "شروع نشده",
  },
  {
    title: "مرور مبحث ۷ (پی)",
    progress: 20,
    status: "نیاز به تمرکز",
  },
  {
    title: "مرور اشتباهات آزمون",
    progress: 65,
    status: "در حال انجام",
  },
];

export default function PlannerPage() {
  return (
    <AppShell>

      <div className="p-8 space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-white">
            برنامه مطالعه هوشمند
          </h1>

          <p className="mt-2 text-zinc-400">
            مدیریت مسیر آمادگی آزمون نظام مهندسی عمران
          </p>
        </div>


        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">
              روز باقی‌مانده
            </p>

            <p className="mt-3 text-4xl font-bold text-blue-400">
              87
            </p>
          </div>


          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">
              آمادگی کلی
            </p>

            <p className="mt-3 text-4xl font-bold text-green-400">
              71%
            </p>
          </div>


          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">
              مباحث تکمیل شده
            </p>

            <p className="mt-3 text-4xl font-bold text-white">
              9/22
            </p>
          </div>

        </div>



        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="text-xl font-bold text-white mb-6">
            برنامه امروز
          </h2>


          <div className="space-y-6">

            {tasks.map((task) => (

              <div key={task.title}>

                <div className="flex justify-between mb-2">

                  <span className="text-white font-medium">
                    {task.title}
                  </span>

                  <span className="text-zinc-400">
                    {task.progress}%
                  </span>

                </div>


                <div className="h-3 rounded-full bg-zinc-800">

                  <div
                    className="h-3 rounded-full bg-blue-500"
                    style={{
                      width: `${task.progress}%`,
                    }}
                  />

                </div>


                <p className="mt-2 text-sm text-zinc-500">
                  {task.status}
                </p>

              </div>

            ))}

          </div>

        </div>



        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="text-xl font-bold text-white">
            پیشنهاد هوش مصنوعی
          </h2>

          <p className="mt-4 text-zinc-400">
            با توجه به عملکرد فعلی، ابتدا مبحث ۹ را مرور کنید، سپس آزمون‌های مرتبط را حل کنید. تمرکز بیشتر روی مباحث ۷ و ۸ باعث افزایش احتمال قبولی خواهد شد.
          </p>

        </div>


      </div>

    </AppShell>
  );
}