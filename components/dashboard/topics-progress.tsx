const topics = [
  { id: 1, name: "مبحث ۱", value: 100 },
  { id: 2, name: "مبحث ۲", value: 90 },
  { id: 3, name: "مبحث ۳", value: 75 },
  { id: 4, name: "مبحث ۴", value: 60 },
  { id: 5, name: "مبحث ۵", value: 40 },
  { id: 6, name: "مبحث ۶", value: 55 },
  { id: 7, name: "مبحث ۷", value: 20 },
  { id: 8, name: "مبحث ۸", value: 30 },
  { id: 9, name: "مبحث ۹", value: 95 },
  { id: 10, name: "مبحث ۱۰", value: 80 },
];

export default function TopicsProgress() {
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
            9/22
          </div>

          <div className="text-sm text-zinc-400">
            مطالعه شده
          </div>

        </div>

      </div>

      <div className="space-y-4">

        {topics.map((topic) => (

          <div key={topic.id}>

            <div className="flex justify-between mb-2 text-sm">

              <span>{topic.name}</span>

              <span>{topic.value}%</span>

            </div>

            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">

              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                style={{
                  width: `${topic.value}%`,
                }}
              />

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}