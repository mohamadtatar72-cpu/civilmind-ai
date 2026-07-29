import { dashboardData } from "@/lib/data/dashboard";

export default function TopicsProgress() {
  const topics = dashboardData.topicsProgress;

  const studiedTopics = topics.filter(
    (topic) => topic.progress > 0
  ).length;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

      <div className="flex items-center justify-between mb-6">

        <div>
          <h2 className="text-xl font-bold">
            پیشرفت مباحث
          </h2>

          <p className="text-zinc-400 text-sm mt-1">
            وضعیت مطالعه مباحث مقررات ملی
          </p>
        </div>

        <div className="text-right">

          <div className="text-3xl font-bold text-blue-400">
            {studiedTopics}/22
          </div>

          <div className="text-sm text-zinc-400">
            مطالعه شده
          </div>

        </div>

      </div>


      <div className="space-y-4">

        {topics.map((topic, index) => (

          <div key={index}>

            <div className="flex justify-between mb-2 text-sm">

              <span>
                {topic.name}
              </span>

              <span>
                {topic.progress}%
              </span>

            </div>


            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">

              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                style={{
                  width: `${topic.progress}%`,
                }}
              />

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}