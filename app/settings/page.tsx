"use client";

import { useQuery } from "convex/react";
import AppShell from "@/components/layout/app-shell";
import { GlassPanel, PageHeader, StatusBadge } from "@/components/ui/civilmind";
import { api } from "@/convex/_generated/api";
import { useCurrentAccount } from "@/features/auth/convex-repository";

export default function SettingsPage() {
  const account = useCurrentAccount();
  const entitlement = useQuery(
    api.access.current,
    account.isAuthenticated ? {} : "skip",
  );
  const syncState = account.loading
    ? ["همگام‌سازی داده‌ها", "در حال اتصال ایمن به Convex…", "در حال بررسی"]
    : account.isAuthenticated
      ? [
          "همگام‌سازی داده‌ها",
          `پروفایل و سطح دسترسی ${entitlement?.tier === "admin" ? "مدیر" : "کاربر"} از Convex Backend خوانده می‌شود.`,
          "متصل",
        ]
      : [
          "همگام‌سازی داده‌ها",
          "برای همگام‌سازی پروفایل، انتخاب رشته و تاریخچهٔ شخصی وارد حساب شوید.",
          "نیازمند ورود",
        ];
  const settings = [
    ["زبان و جهت نمایش", "فارسی — راست‌به‌چپ", "فعال"],
    ["اعلان‌های برنامه مطالعه", "پس از اتصال حساب کاربری قابل تنظیم است", "در حال توسعه"],
    syncState,
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="تنظیمات"
          title="تنظیم تجربه CivilMind"
          description="وضعیت تنظیمات پایه و اتصال ایمن داده‌های شخصی."
        />
        <GlassPanel className="divide-y divide-white/8 p-0">
          {settings.map(([title, description, status]) => (
            <div key={title} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold">{title}</h2>
                <p className="mt-1 text-sm text-slate-400">{description}</p>
              </div>
              <StatusBadge tone={status === "فعال" || status === "متصل" ? "success" : "info"}>{status}</StatusBadge>
            </div>
          ))}
        </GlassPanel>
      </div>
    </AppShell>
  );
}
