import AppShell from "@/components/layout/app-shell";
import { topics } from "@/lib/data/library";
import Link from "next/link";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const topic = topics.find(
    (item) => item.id === Number(id)
  );

  if (!topic) {
    return (
      <AppShell>
        <div className="p-8 text-white">
          مبحث پیدا نشد
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>

      <div className="p-8 space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-white">
            {topic.title}
          </h1>

          <p className="mt-2 text-zinc-400">
            مرکز مطالعه، تحلیل و آمادگی آزمون این مبحث
          </p>
        </div>


        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">
              درصد مطالعه
            </p>

            <p className="mt-3 text-4xl font-bold text-blue-400">
              {topic.progress}%
            </p>
          </div>


          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">
              بانک سوال
            </p>

            <p className="mt-3 text-4xl font-bold text-white">
              {topic.questions}
            </p>
          </div>


          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-zinc-400">
              وضعیت PDF
            </p>

            <p className="mt-3 text-2xl font-bold text-green-400">
              {topic.pdf ? "موجود" : "ندارد"}
            </p>
          </div>

        </div>



        <div className="grid gap-6 md:grid-cols-2">


          <Link
            href={`/pdf?topic=${topic.id}`}
            className="rounded-2xl bg-blue-600 p-5 text-center text-white font-bold hover:bg-blue-700"
          >
            📄 مشاهده PDF مبحث
          </Link>


          <button
            className="rounded-2xl bg-zinc-800 p-5 text-white font-bold hover:bg-zinc-700"
          >
            🧠 خلاصه‌سازی با هوش مصنوعی
          </button>


          <button
            className="rounded-2xl bg-zinc-800 p-5 text-white font-bold hover:bg-zinc-700"
          >
            📝 شروع آزمون این مبحث
          </button>


          <button
            className="rounded-2xl bg-zinc-800 p-5 text-white font-bold hover:bg-zinc-700"
          >
            📊 تحلیل عملکرد من
          </button>


        </div>



        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="text-xl font-bold text-white">
            پیشنهاد هوش مصنوعی
          </h2>

          <p className="mt-4 text-zinc-400">
            بر اساس روند مطالعه، پیشنهاد می‌شود ابتدا بخش‌های مهم این مبحث را مرور کرده و سپس آزمون‌های مرتبط را حل کنید.
          </p>

        </div>



        <Link
          href="/library"
          className="inline-block text-blue-400"
        >
          ← بازگشت به مباحث ۲۲ گانه
        </Link>


      </div>

    </AppShell>
  );
}