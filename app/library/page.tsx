import Link from "next/link";
import AppShell from "@/components/layout/app-shell";
import { topics } from "@/lib/data/library";

export default function LibraryPage() {
  return (
    <AppShell>

      <div className="p-8 space-y-8">


        <div>
          <h1 className="text-3xl font-bold text-white">
            📚 کتابخانه هوشمند CivilMind AI
          </h1>

          <p className="mt-2 text-zinc-400">
            مدیریت PDF ها، مباحث مقررات ملی، بانک سوالات و میزان آمادگی آزمون عمران
          </p>
        </div>



        <div className="grid gap-5 md:grid-cols-4">


          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-zinc-400">
              تعداد مباحث
            </p>

            <p className="mt-3 text-4xl font-bold text-white">
              22
            </p>
          </div>


          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-zinc-400">
              PDF موجود
            </p>

            <p className="mt-3 text-4xl font-bold text-blue-400">
              24
            </p>
          </div>


          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-zinc-400">
              سوالات ذخیره شده
            </p>

            <p className="mt-3 text-4xl font-bold text-green-400">
              1320
            </p>
          </div>


          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-zinc-400">
              پیشرفت کلی
            </p>

            <p className="mt-3 text-4xl font-bold text-purple-400">
              71%
            </p>
          </div>


        </div>





        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">


          {topics.map((topic) => (

            <div
              key={topic.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 hover:border-blue-500 transition"
            >


              <div className="flex justify-between items-center">

                <h2 className="font-bold text-lg text-white">
                  {topic.title}
                </h2>


                <span className="text-blue-400 font-bold">
                  {topic.progress}%
                </span>


              </div>




              <div className="mt-5 h-2 rounded-full bg-zinc-800">

                <div
                  className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                  style={{
                    width: `${topic.progress}%`,
                  }}
                />

              </div>





              <div className="mt-5 space-y-2 text-sm text-zinc-400">


                <p>
                  📄 PDF:
                  <span className="text-white">
                    {" "}
                    {topic.pdf ? " موجود" : " ندارد"}
                  </span>
                </p>


                <p>
                  📝 بانک سوال:
                  <span className="text-white">
                    {" "}
                    {topic.questions}
                  </span>
                </p>


                <p>
                  🤖 تحلیل AI:
                  <span className="text-green-400">
                    {" "}
                    فعال
                  </span>
                </p>


              </div>





              <Link
                href={`/library/${topic.id}`}
                className="mt-6 block rounded-xl bg-blue-600 px-4 py-3 text-center text-white font-bold hover:bg-blue-700"
              >
                ورود به مبحث
              </Link>


            </div>


          ))}


        </div>



      </div>


    </AppShell>
  );
}