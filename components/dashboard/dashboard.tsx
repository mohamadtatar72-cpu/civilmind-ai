import { BarChart3, BookOpen, FileText, Gauge, Target } from "lucide-react";
import Link from "next/link";
import type { DashboardReadModel } from "@/features/dashboard/domain";
import { GlassPanel, MetricCard, PageHeader, SectionTitle, StatusBadge } from "@/components/ui/civilmind";

export default function Dashboard({ data }: { data: DashboardReadModel }) {
  return <div className="space-y-6">
    <PageHeader eyebrow="مرکز مأموریت" title="سلام مهندس؛ مسیر امروز آماده است"
      description={data.readiness.examTitle}
      action={<Link href="/planner" className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400">مشاهده برنامه امروز</Link>} />
    <GlassPanel className="overflow-hidden bg-gradient-to-l from-blue-500/15 to-cyan-400/5">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div><StatusBadge tone="success">روند آمادگی صعودی</StatusBadge><h2 className="mt-4 text-2xl font-black">احتمال قبولی فعلی: {data.readiness.passProbability}٪</h2><p className="mt-2 max-w-2xl leading-7 text-slate-400">با تمرکز روی مباحث ۷ و ۸ و ادامه حل آزمون‌های جامع، مسیر شما برای رسیدن به آمادگی پایدار مناسب ارزیابی می‌شود.</p></div>
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/15 p-4"><Gauge className="size-9 text-blue-300" /><div><p className="text-xs text-slate-400">آمادگی کل</p><p data-numeric className="text-3xl font-black">{data.readiness.percentage}٪</p></div></div>
      </div>
    </GlassPanel>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {data.metrics.map((metric, index) => <MetricCard key={metric.id} {...metric} icon={[BookOpen, BarChart3, Target, FileText][index]} />)}
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <GlassPanel><SectionTitle title="برنامه مطالعه امروز" description="اولویت‌بندی‌شده بر اساس آمادگی فعلی" actionHref="/planner" />
        <div className="space-y-5">{data.tasks.map(task => <div key={task.id}><div className="mb-2 flex justify-between gap-4 text-sm"><span className="font-medium">{task.title}</span><span data-numeric className="text-slate-400">{task.progress}٪</span></div><div className="h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-l from-blue-400 to-cyan-400" style={{ width: `${task.progress}%` }} /></div></div>)}</div>
      </GlassPanel>
      <GlassPanel><SectionTitle title="فعالیت‌های اخیر" description="آخرین نقاط ثبت‌شده در مسیر شما" />
        <div className="space-y-3">{data.activities.map(item => <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-black/10 p-4"><div><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-emerald-300">{item.status}</p></div><time className="text-xs text-slate-500">{item.relativeTime}</time></div>)}</div>
      </GlassPanel>
    </div>
  </div>;
}
