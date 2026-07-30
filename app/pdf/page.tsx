import Link from "next/link";
import AppShell from "@/components/layout/app-shell";
import { GlassPanel, PageHeader, SectionTitle, StatusBadge } from "@/components/ui/civilmind";
import { topics } from "@/lib/data/library";

export default function PdfLibraryPage() {
  const available = topics.filter(topic => topic.pdf);
  return <AppShell><div className="space-y-6">
    <PageHeader eyebrow="کتابخانه PDF" title="منابع آزمون در یک نمای مطمئن" description="فهرست منابع موجود برای مطالعه؛ نمایشگر و بارگذاری فایل در فاز اتصال سرویس فعال می‌شود." action={<StatusBadge tone="info">{available.length} منبع موجود</StatusBadge>} />
    <GlassPanel><SectionTitle title="مباحث مقررات ملی" description="برای ورود به نمای هر مبحث، عنوان آن را انتخاب کنید." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{available.map(topic =>
        <Link key={topic.id} href={`/library/${topic.id}`} className="group rounded-xl border border-white/8 bg-black/10 p-4 transition hover:border-blue-400/30 hover:bg-blue-400/5">
          <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold leading-7 text-slate-100">{topic.title}</h2><p className="mt-2 text-xs text-slate-500">{topic.questions} سؤال مرتبط</p></div><StatusBadge tone="success">موجود</StatusBadge></div>
        </Link>)}</div>
    </GlassPanel>
  </div></AppShell>;
}
