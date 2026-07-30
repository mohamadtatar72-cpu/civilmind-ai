import { Target, TrendingUp, TriangleAlert } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { GlassPanel, MetricCard, PageHeader, SectionTitle, StatusBadge } from "@/components/ui/civilmind";
import { dashboardData } from "@/lib/data/dashboard";

export default function PredictionPage() {
  const { readiness } = dashboardData;
  return <AppShell><div className="space-y-6"><PageHeader eyebrow="مرکز پیش‌بینی" title="برآورد آمادگی و احتمال قبولی" description="این برآورد فعلاً بر داده‌های نمایشی مطالعه و آزمون متکی است و جایگزین نتیجه رسمی نیست." action={<StatusBadge tone="warning">مدل نمایشی</StatusBadge>} />
    <div className="grid gap-4 md:grid-cols-3"><MetricCard label="احتمال قبولی" value={`${readiness.passProbability}٪`} detail="در صورت حفظ روند فعلی" icon={Target} tone="green" /><MetricCard label="آمادگی فعلی" value={`${readiness.percentage}٪`} detail="برآیند مطالعه و آزمون" icon={TrendingUp} /><MetricCard label="روز باقی‌مانده" value={`${readiness.daysLeft}`} detail="برای اجرای برنامه پیشنهادی" icon={TriangleAlert} tone="amber" /></div>
    <GlassPanel><SectionTitle title="تفسیر نتیجه" /><p className="leading-8 text-slate-300">روند کلی مثبت است. بیشترین اثر کوتاه‌مدت از مرور مباحث ۷ و ۸، تحلیل اشتباهات و تکمیل آزمون‌های جامع حاصل می‌شود. با ورود داده واقعی، قرارداد همین صفحه به مخزن بک‌اند متصل خواهد شد.</p></GlassPanel>
  </div></AppShell>;
}
