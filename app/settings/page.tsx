import AppShell from "@/components/layout/app-shell";
import { GlassPanel, PageHeader, StatusBadge } from "@/components/ui/civilmind";

const settings = [
  ["زبان و جهت نمایش", "فارسی — راست‌به‌چپ", "فعال"],
  ["اعلان‌های برنامه مطالعه", "پس از اتصال حساب کاربری قابل تنظیم است", "در حال توسعه"],
  ["همگام‌سازی داده‌ها", "مخزن محلی نمایشی؛ آماده جایگزینی با بک‌اند", "آماده اتصال"],
];

export default function SettingsPage() {
  return <AppShell><div className="space-y-6"><PageHeader eyebrow="تنظیمات" title="تنظیم تجربه CivilMind" description="وضعیت تنظیمات پایه و قابلیت‌هایی که در فازهای بعدی فعال می‌شوند." />
    <GlassPanel className="divide-y divide-white/8 p-0">{settings.map(([title, description, status]) => <div key={title} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-slate-400">{description}</p></div><StatusBadge tone={status === "فعال" ? "success" : "info"}>{status}</StatusBadge></div>)}</GlassPanel>
  </div></AppShell>;
}
