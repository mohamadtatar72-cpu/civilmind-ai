import AppShell from "@/components/layout/app-shell";
import { topics } from "@/lib/data/library";

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
      <div className="p-8 space-y-6">

        <h1 className="text-3xl font-bold text-white">
          {topic.title}
        </h1>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <p className="text-zinc-400">
            درصد مطالعه
          </p>

          <p className="text-4xl font-bold text-blue-400">
            {topic.progress}%
          </p>

          <div className="mt-4 text-zinc-300">
            تعداد سوالات: {topic.questions}
          </div>

        </div>

      </div>
    </AppShell>
  );
}