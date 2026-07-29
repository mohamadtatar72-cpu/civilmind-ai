import AppShell from "@/components/layout/app-shell";
import { topics } from "@/lib/data/library";

export default function LibraryPage() {
  return (
    <AppShell>

      <div className="p-8 space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-white">
            مباحث ۲۲ گانه مقررات ملی ساختمان
          </h1>

          <p className="mt-2 text-zinc-400">
            مدیریت منابع، PDF ها، میزان مطالعه و بانک سوالات آزمون نظام مهندسی عمران
          </p>
        </div>


        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {topics.map((topic) => (

            <div
              key={topic.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"
            >

              <div className="flex justify-between items-start">

                <h2 className="font-bold text-lg text-white">
                  {topic.title}
                </h2>

                <span className="text-blue-400 font-bold">
                  {topic.progress}%
                </span>

              </div>


              <div className="mt-5 h-2 rounded-full bg-zinc-800">

                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{
                    width: `${topic.progress}%`,
                  }}
                />

              </div>


              <div className="mt-5 flex justify-between text-sm text-zinc-400">

                <span>
                  PDF {topic.pdf ? "✓" : "×"}
                </span>

                <span>
                  {topic.questions} سوال
                </span>

              </div>


            </div>

          ))}

        </div>

      </div>

    </AppShell>
  );
}