import AppShell from "@/components/layout/app-shell";

const suggestions = [
  {
    title: "خلاصه مبحث ۹ بتن",
    icon: "📘",
  },
  {
    title: "تحلیل آزمون اخیر",
    icon: "📊",
  },
  {
    title: "برنامه مطالعه امروز",
    icon: "📅",
  },
  {
    title: "سوال از PDF ها",
    icon: "❓",
  },
];


export default function AIPage() {
  return (
    <AppShell>

      <div className="p-8 space-y-8">


        <div>
          <h1 className="text-3xl font-bold text-white">
            AI Assistant
          </h1>

          <p className="mt-2 text-zinc-400">
            دستیار هوشمند CivilMind برای آمادگی آزمون نظام مهندسی عمران
          </p>
        </div>



        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="text-xl font-bold text-white">
            سلام مهندس 👋
          </h2>

          <p className="mt-3 text-zinc-400">
            من دستیار هوشمند CivilMind هستم. می‌توانم در مطالعه مباحث، تحلیل آزمون‌ها و آماده‌سازی آزمون نظام مهندسی به شما کمک کنم.
          </p>


          <div className="mt-6 flex gap-3">

            <input
              placeholder="سوال خود را درباره عمران و آزمون بنویسید..."
              className="flex-1 rounded-xl bg-zinc-800 px-4 py-3 text-white outline-none"
            />


            <button
              className="rounded-xl bg-blue-600 px-6 text-white font-bold hover:bg-blue-700"
            >
              ارسال
            </button>

          </div>

        </div>





        <div>

          <h2 className="mb-5 text-xl font-bold text-white">
            پیشنهادهای سریع
          </h2>


          <div className="grid gap-5 md:grid-cols-4">

            {suggestions.map((item)=>(

              <button
                key={item.title}
                className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-right hover:bg-zinc-800"
              >

                <div className="text-3xl">
                  {item.icon}
                </div>


                <p className="mt-4 font-bold text-white">
                  {item.title}
                </p>


              </button>

            ))}

          </div>

        </div>





        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">


          <h2 className="text-xl font-bold text-white">
            آخرین تحلیل هوش مصنوعی
          </h2>


          <p className="mt-4 text-zinc-400 leading-8">
            بر اساس روند مطالعه شما، پیشنهاد می‌شود ابتدا مبحث ۷ و ۸ مرور شود. سپس آزمون‌های مرتبط حل شده و اشتباهات آزمون‌های قبلی بررسی گردد.
          </p>


        </div>



      </div>

    </AppShell>
  );
}