import AppShell from "@/components/layout/app-shell";

const exams = [
  {
    title: "آزمون جامع شماره ۵",
    score: 78,
    date: "امروز",
  },
  {
    title: "آزمون مبحثی عمران",
    score: 72,
    date: "۳ روز قبل",
  },
  {
    title: "آزمون شبیه‌سازی شماره ۳",
    score: 65,
    date: "یک هفته قبل",
  },
];


const weakTopics = [
  "مبحث ۷ - پی",
  "مبحث ۸ - بتن",
  "بارگذاری",
];


const strongTopics = [
  "مبحث ۶ - بارهای وارد",
  "مبحث ۹ - بتن",
  "مبحث ۱۰ - فولاد",
];


export default function AnalyticsPage() {

  return (

    <AppShell>

      <div className="p-8 space-y-8">


        <div>

          <h1 className="text-3xl font-bold text-white">
            تحلیل آزمون
          </h1>

          <p className="mt-2 text-zinc-400">
            بررسی عملکرد آزمون‌ها، نقاط قوت و ضعف
          </p>

        </div>



        <div className="grid gap-6 md:grid-cols-3">


          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

            <p className="text-zinc-400">
              میانگین آزمون‌ها
            </p>

            <p className="mt-3 text-4xl font-bold text-blue-400">
              71%
            </p>

          </div>



          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

            <p className="text-zinc-400">
              تعداد آزمون حل شده
            </p>

            <p className="mt-3 text-4xl font-bold text-white">
              24
            </p>

          </div>



          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

            <p className="text-zinc-400">
              روند پیشرفت
            </p>

            <p className="mt-3 text-4xl font-bold text-green-400">
              +18%
            </p>

          </div>


        </div>




        <div className="grid gap-6 md:grid-cols-2">


          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

            <h2 className="text-xl font-bold text-white mb-5">
              نقاط قوت
            </h2>


            <div className="space-y-3">

              {strongTopics.map((item)=>(

                <div
                  key={item}
                  className="rounded-xl bg-zinc-800 p-4 text-green-400"
                >
                  ✓ {item}
                </div>

              ))}

            </div>

          </div>




          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

            <h2 className="text-xl font-bold text-white mb-5">
              نقاط ضعف
            </h2>


            <div className="space-y-3">

              {weakTopics.map((item)=>(

                <div
                  key={item}
                  className="rounded-xl bg-zinc-800 p-4 text-red-400"
                >
                  ⚠ {item}
                </div>

              ))}

            </div>

          </div>


        </div>





        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="text-xl font-bold text-white mb-5">
            تاریخچه آزمون‌ها
          </h2>


          <div className="space-y-4">


            {exams.map((exam)=>(

              <div
                key={exam.title}
                className="flex justify-between items-center rounded-2xl bg-zinc-800/50 p-4"
              >

                <div>

                  <p className="font-bold text-white">
                    {exam.title}
                  </p>

                  <p className="text-sm text-zinc-400">
                    {exam.date}
                  </p>

                </div>


                <div className="text-2xl font-bold text-blue-400">
                  {exam.score}%
                </div>


              </div>

            ))}


          </div>

        </div>




        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="text-xl font-bold text-white">
            تحلیل هوش مصنوعی
          </h2>

          <p className="mt-4 text-zinc-400">
            عملکرد شما روند صعودی دارد. پیشنهاد می‌شود قبل از آزمون بعدی، مباحث ۷ و ۸ مرور شده و آزمون‌های بیشتری از این بخش‌ها حل شود.
          </p>

        </div>



      </div>


    </AppShell>

  );
}