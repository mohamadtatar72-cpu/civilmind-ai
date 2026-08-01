import { Target, TrendingUp, TriangleAlert } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { GlassPanel, MetricCard, PageHeader, SectionTitle, StatusBadge } from "@/components/ui/civilmind";

export default function PredictionPage() {
  return <AppShell><div className="space-y-6"><PageHeader eyebrow="مرکز آمادگی" title="آمادگی شما بر پایه داده واقعی" description="تا زمانی که سابقه مطالعه و آزمون کافی ثبت نشده باشد، CivilMind AI احتمال قبولی یا عدد پیش‌بینی‌شده نمایش نمی‌دهد." action={<StatusBadge tone="warning">داده کافی نیست</StatusBadge>} />
    <div className="grid gap-4 md:grid-cols-3"><MetricCard label="سابقه آزمون ثبت‌شده" value="—" detail="برای محاسبه نیاز به آزمون تکمیل‌شده دارید" icon={Target} tone="green" /><MetricCard label="شاخص آمادگی" value="—" detail="پس از اتصال داده واقعی محاسبه می‌شود" icon={TrendingUp} /><MetricCard label="گام بعدی" value="آزمون" detail="یک آزمون رسمی یا تمرینی ثبت کنید" icon={TriangleAlert} tone="amber" /></div>
    <GlassPanel><SectionTitle title="روش محاسبه" /><p className="leading-8 text-slate-300">وقتی داده کافی وجود داشته باشد، این بخش با پوشش مباحث، نسبت پاسخ صحیح، زمان پاسخ‌گویی، تداوم مطالعه و روند اخیر کار می‌کند. خروجی همیشه برآورد است، نه تضمین قبولی.</p></GlassPanel>
  </div></AppShell>;
}
