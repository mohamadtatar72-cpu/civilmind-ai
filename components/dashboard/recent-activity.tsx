export default function RecentActivity() {
  const items = [
    {
      title: "مبحث 9 بتن",
      action: "مطالعه شد",
      time: "امروز",
    },
    {
      title: "آزمون جامع شماره 5",
      action: "تکمیل شد",
      time: "دیروز",
    },
    {
      title: "بارگذاری PDF مبحث 7",
      action: "انجام شد",
      time: "۲ روز قبل",
    },
    {
      title: "تحلیل هوش مصنوعی",
      action: "به‌روزرسانی شد",
      time: "۳ روز قبل",
    },
  ];

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-xl font-bold text-white">
        آخرین فعالیت‌ها
      </h2>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex items-center justify-between rounded-2xl bg-zinc-800/50 p-4"
          >
            <div>
              <p className="font-semibold text-white">
                {item.title}
              </p>

              <p className="text-sm text-zinc-400">
                {item.action}
              </p>
            </div>

            <span className="text-sm text-zinc-500">
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}