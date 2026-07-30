import { dashboardData } from "@/lib/data/dashboard";

export default function TodayPlan() {
  const tasks = dashboardData.tasks;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

      <h2 className="text-xl font-bold mb-6">
        برنامه امروز
      </h2>


      <div className="space-y-5">

        {tasks.map((task) => (

          <div key={task.title}>

            <div className="flex justify-between mb-2">

              <span>
                {task.title}
              </span>

              <span className="text-zinc-400">
                {task.progress}%
              </span>

            </div>


            <div className="h-2 rounded-full bg-zinc-800">

              <div
                className="h-2 rounded-full bg-blue-500"
                style={{
                  width: `${task.progress}%`,
                }}
              />

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}
